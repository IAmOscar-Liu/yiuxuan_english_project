import { messagingApi } from "@line/bot-sdk";
import client from "../lib/client";
import {
  completeVideoCourse,
  getChatDocumentById,
} from "../lib/firebase_admin";

export function handleLearningSummaryMessage({
  replyToken,
  text,
  threadId,
}: {
  replyToken?: string;
  text: string;
  threadId: string;
}) {
  if (!replyToken) return Promise.resolve(null);

  const echo: messagingApi.Message = {
    type: "text",
    text,
  };

  const templateMessage: messagingApi.Message = {
    type: "template",
    altText: "點此檢視本次學習的成果圖卡",
    template: {
      type: "buttons",
      text: "點此檢視本次學習的成果圖卡",
      actions: [
        {
          type: "postback",
          label: "查看成果圖卡",
          data: `user_request_learning_summary_card:${threadId}`,
        },
      ],
    },
  };

  return client.replyMessage({
    replyToken,
    messages: [echo, templateMessage],
  });
}

// export async function markCourseCompletedByThreadId(threadId: string) {
//   try {
//     const chatDoc = await getChatDocumentById(threadId);
//     if (!chatDoc) throw new Error("Chat document not found");
//     await completeVideoCourse({
//       userId: chatDoc.userId,
//       name: chatDoc.courseKey,
//       completeQA: true,
//     });
//     return true;
//   } catch (error) {
//     console.error(`Fail to complete video course - ${error}`);
//     return false;
//   }
// }
