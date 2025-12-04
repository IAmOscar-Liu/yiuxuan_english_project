import { Report } from "./type";

/**
 * Try to parse the assistant reply as a report JSON.
 * If it doesn't match the expected shape, return null.
 */
export function tryParseReport(text: string): Report | null {
  const trimmed = text.trim();
  if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) return null;

  try {
    const obj = JSON.parse(trimmed);

    if (
      obj &&
      typeof obj === "object" &&
      typeof obj.complete === "boolean" &&
      typeof obj.topic === "string" &&
      typeof obj.summary === "string" &&
      typeof obj.comment === "string" &&
      typeof obj.involvedKnowledge === "string" &&
      (typeof obj.score === "number" || typeof obj.score === "string")
    ) {
      obj.score = Number(obj.score);
      return obj as Report;
    }
  } catch {
    // not valid JSON, ignore
  }

  return null;
}

export function createReportString(summary: Report) {
  let result = "恭喜你完成課程！以下是你此次的學習成果：\n\n";

  if (summary.topic) result += `學習主題：${summary.topic}\n\n`;
  if (summary.involvedKnowledge) {
    result += `涉及知識點：\n${summary.involvedKnowledge}\n\n`;
  }
  // result += `涉及知識點：\n${summary.topics
  //   .map((t) => `- ${t}`)
  //   .join("\n")}\n\n`;
  if (summary.summary) result += `成果總覽：\n${summary.summary}\n\n`;
  if (summary.comment) result += `評語：\n${summary.comment}\n\n`;
  if (summary.score) result += `評分：${summary.score}/5`;

  return result;
}
