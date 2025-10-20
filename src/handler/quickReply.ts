import { messagingApi } from "@line/bot-sdk";
import client from "../lib/client";
import { COURSE_INFO, VIDEO_PATHS } from "../constants/courseInfo";
import { isChapterCompleted } from "./taskHandler";
import { handleTextMessage } from "./textMessage";

export function handleLearningSummaryTargetQuickReply({
  replyToken,
  userId,
  associatedStudents,
}: {
  replyToken?: string;
  userId: string;
  associatedStudents: Array<{ id: string; name: string }>;
}) {
  if (!replyToken) return Promise.resolve(null);

  const templateMessage: messagingApi.Message = {
    type: "text",
    text: "請選擇您想查看的對象",
    quickReply: {
      items: [
        {
          type: "action",
          action: {
            type: "postback",
            label: "自己",
            data: `user_request_learning_summary_carousel:${JSON.stringify({
              id: userId,
            })}`,
          },
        },
        ...associatedStudents.map(
          ({ id, name }) =>
            ({
              type: "action",
              action: {
                type: "postback",
                label: `學生-${name}`,
                data: `user_request_learning_summary_carousel:${JSON.stringify({
                  id,
                  name,
                })}`,
              },
            } as messagingApi.QuickReplyItem)
        ),
      ],
    },
  };

  // use reply API
  return client.replyMessage({
    replyToken,
    messages: [templateMessage],
  });
}

export function handleLearningQuickReply({
  replyToken,
  user,
}: {
  replyToken?: string;
  user: {
    [field: string]: any;
  };
}) {
  if (!replyToken) return Promise.resolve(null);

  const echo: messagingApi.Message = {
    type: "text",
    text: `Hello ${user.nickName}，您即將開始今天的課程，在課程開始前，請先確定網路順暢，如需結束，請再次點選主選單『開始/結束課程』，祝您學習愉快！`,
  };

  const completedChapters = [];
  for (let key of Object.keys(COURSE_INFO)) {
    if (isChapterCompleted(user, key as unknown as keyof typeof COURSE_INFO)) {
      completedChapters.push({
        key,
        title: COURSE_INFO[key as unknown as keyof typeof COURSE_INFO].title,
      });
    }
  }
  //   // create an echoing text message
  // create an echoing text message
  const templateMessage: messagingApi.Message = {
    type: "text",
    text: "請問你今天想學習什麼呢？",
    quickReply: {
      items: [
        // {
        //   type: "action",
        //   action: {
        //     type: "postback",
        //     label: "文法A",
        //     data: "user_want_learn_grammar",
        //   },
        // },
        // {
        //   type: "action",
        //   action: {
        //     type: "postback",
        //     label: "文法B",
        //     data: "user_want_learn_grammar",
        //   },
        // },
        ...completedChapters.map(
          (c) =>
            ({
              type: "action",
              action: {
                type: "postback",
                label: String(c.title).slice(0, 20),
                data: `user_want_learn_grammar:${c.key}`,
              },
            } as messagingApi.QuickReplyItem)
        ),
        {
          type: "action",
          action: {
            type: "postback",
            label: "自訂",
            data: "user_want_learn_grammar:auto",
          },
        },
      ],
    },
  };

  // use reply API
  return client.replyMessage({
    replyToken,
    messages: [echo, templateMessage],
  });
}

export function handleChapterItemsQuickReply({
  replyToken,
  chapter,
}: {
  replyToken?: string;
  chapter: string;
}) {
  if (!replyToken) return Promise.resolve(null);

  const chapterInfo =
    COURSE_INFO[chapter as unknown as keyof typeof COURSE_INFO];

  if (!chapterInfo)
    return handleTextMessage({ replyToken, text: "章節不存在" });

  //   // create an echoing text message
  // create an echoing text message
  const templateMessage: messagingApi.Message = {
    type: "text",
    text: `好的，請問您想學習「${chapterInfo.title}」的哪個子章節呢？`,
    quickReply: {
      items: chapterInfo.contents.map(
        (key: string) =>
          ({
            type: "action",
            action: {
              type: "postback",
              label: VIDEO_PATHS[key].title.slice(0, 20),
              data: `user_want_learn_grammar:${key}`,
            },
          } as messagingApi.QuickReplyItem)
      ),
    },
  };

  // use reply API
  return client.replyMessage({
    replyToken,
    messages: [templateMessage],
  });
}
