import { openai, OpenAIReport } from ".";

export async function generateReport({
  threadId,
  assistantId,
}: {
  threadId: string;
  assistantId: string;
}) {
  console.log(`Generate report with threadId: ${threadId}`);

  // 如果完成：請模型生成「學習成果報告」
  let report: {
    topic: string;
    summary: string;
    comment: string;
    topics: string[];
    score: number;
  } | null = null;

  // 要求只輸出 JSON，並定義 schema 與評分規則
  const instructionForReport = `
請根據本 thread 的整體互動，輸出一份「本次學習成果」的 JSON，必須嚴格只輸出 JSON（一行起頭為 {，不得有任何多餘文字）。
Schema：
{
  "topic": string,               // 本次學習章節的標題（如「1-2 過去式」）
  "summary": string,             // 本次學習重點與表現摘要（中文，可引用學生的例句）
  "comment": string,        // 對學生的具體評語（中文，2~4 句，包含優點與可改進處）
  "topics": string[],       // 涉及的知識點，1~3 個，使用中文短語（例如："現在簡單式肯定句"）
  "score": number           // 1~5 的整數，綜合答題正確性、表達清晰度、反饋接受度
}
評分說明：5=表現優秀，1=需加強。
            `.trim();

  // 在 thread 中發系統訊息，讓助理依此產出 JSON 報告
  await openai.beta.threads.messages.create(threadId, {
    role: "user",
    content: instructionForReport,
  });

  // 再跑一次
  const reportRun = await openai.beta.threads.runs.create(threadId, {
    assistant_id: assistantId,
  });

  // 等待報告完成
  const reportStatus = await pollRun({ threadId, runId: reportRun.id });

  // 讀取最新訊息並嘗試 parse JSON
  const msgs = await openai.beta.threads.messages.list(threadId);
  const latest = msgs.data[0];
  let text = "";
  if (
    latest &&
    latest.content &&
    latest.content[0] &&
    "text" in latest.content[0]
  ) {
    text = (latest.content[0] as { text: { value: string } }).text.value;
  }

  const jsonStr = extractJson(text);
  if (jsonStr) {
    try {
      const parsed = JSON.parse(jsonStr);
      // 基本校驗
      if (
        typeof parsed.comment === "string" &&
        Array.isArray(parsed.topics) &&
        Number.isInteger(parsed.score)
      ) {
        report = {
          topic: parsed.topic,
          summary: parsed.summary,
          comment: parsed.comment,
          topics: parsed.topics,
          score: parsed.score,
        };
      }
    } catch {}
  }

  return report;
}

// 抽出第一段 JSON（容錯：就算被包在 ```json 也能取出）
function extractJson(s: string) {
  const fenced = s.match(/```json\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1];
  const plain = s.match(/\{[\s\S]*\}/);
  return plain ? plain[0] : "";
}

// helper: poll until done
export async function pollRun(
  {
    threadId,
    runId,
  }: {
    threadId: string;
    runId: string;
  },
  timeout: number = 60000
) {
  const startTime = Date.now();

  while (true) {
    if (Date.now() - startTime > timeout) {
      try {
        // Attempt to cancel the run on timeout
        await openai.beta.threads.runs.cancel(runId, { thread_id: threadId });
        console.log(`Run ${runId} cancelled due to timeout.`);
      } catch (cancelError) {
        console.error(`Failed to cancel run ${runId} on timeout:`, cancelError);
      }
      throw new Error(`Polling for run ${runId} timed out after 60 seconds.`);
    }

    const st = await openai.beta.threads.runs.retrieve(runId, {
      thread_id: threadId,
    });
    if (st.status === "failed") {
      throw new Error("Assistant run failed");
    }
    if (
      ["completed", "requires_action", "cancelled", "expired"].includes(
        st.status
      )
    ) {
      return st;
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
}

export function createReportString(summary: OpenAIReport) {
  let result = "恭喜你完成課程！以下是你此次的學習成果：\n\n";

  if (summary.topic) result += `學習主題：${summary.topic}\n\n`;
  if (summary.topics)
    result += `涉及知識點：\n${summary.topics
      .map((t) => `- ${t}`)
      .join("\n")}\n\n`;
  if (summary.summary) result += `成果總覽：\n${summary.summary}\n\n`;
  if (summary.comment) result += `評語：\n${summary.comment}\n\n`;
  if (summary.score) result += `評分：${summary.score}/5`;

  return result;
}
