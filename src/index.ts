import { middleware, webhook } from "@line/bot-sdk";
import cors from "cors";
import "dotenv/config";
import express from "express";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { corsOptions } from "./constants/corsOptions";
import { VIDEO_PATHS } from "./constants/courseInfo";
import { richMenuAArea, richMenuBArea } from "./constants/richMenuArea";
import { handleAlertMessage } from "./handler/alertMessage";
import { handleConfirmMessage } from "./handler/confirmMessage";
import {
  handleLearningSummaryCarouselMessage,
  handleLearningSummaryFlexMessage,
} from "./handler/flexMessage";
import { handleJoin } from "./handler/join";
import { handleLiffButtonMessage } from "./handler/LiffButtonMessage";
import {
  handleLinkRichMenuIdToUser,
  handleUnLinkRichMenuIdToUser,
} from "./handler/linkRichMenuIdToUser";
import { handleLearningSummaryMessage } from "./handler/others";
import {
  handleChapterItemsQuickReply,
  handleLearningQuickReply,
  handleLearningSummaryTargetQuickReply,
} from "./handler/quickReply";
import {
  formatCourseKey,
  hasUncompletedTask,
  isChapterCompleted,
  taskHandler,
} from "./handler/taskHandler";
import { handleTextMessage } from "./handler/textMessage";
import {
  completeVideoCourse,
  createChat,
  getChatDocumentById,
  getChatDocumentsByUserId,
  getUserDocumentById,
  linkStudentToParent,
  logInUser,
  logOutUser,
} from "./lib/firebase_admin";
import { formatUserRole } from "./lib/formatter";
import { isFuzzyMatch } from "./lib/isFuzzyMatch";
import { OpenAILib } from "./lib/openAI";
import { createReportString } from "./lib/openAI/utils";
import { limiter } from "./lib/rateLimit";
import { readRichMenuBId } from "./lib/readRichMenuId";
import RedisLib from "./lib/redis";
import authenticateToken from "./middleware/authenticateToken";
import AdminRoute from "./router/admin";
import ChatRoute from "./router/chat";
import SurveyRoute from "./router/survey";
import UserRoute from "./router/user";
import VideoRoute from "./router/video";

// create LINE SDK config from env variables
const lineMiddleware = middleware({
  channelSecret: process.env.LINE_CHANNEL_SECRET!,
});

console.log(process.env.NODE_ENV);
console.log(process.env.LINE_CHANNEL_SECRET);

RedisLib.clearAllRedisData();

// create Express app
// about Express itself: https://expressjs.com/
const app = express(); // Use the cors middleware

app.get("/api/test", (req, res) => {
  res.json({ result: "success" });
});

app.post(
  "/api/link-student-to-parent",
  cors(corsOptions),
  express.json(),
  authenticateToken,
  async (req, res) => {
    // Make the function async
    const { userId, userName, parentId } = req.body;

    if (!userId || !userName || !parentId) {
      return res.status(400).send({
        error: "Missing userId, userName or parentId in request body.",
      });
    }

    const result = await linkStudentToParent({ userId, userName, parentId });
    return res.status(200).send({
      success: result,
      message: result
        ? `Successfully link student ${userId} to parent: ${parentId}`
        : `Failed to link student ${userId} to parent: ${parentId}`,
    });
  }
);

app.post(
  "/api/push-message",
  cors(corsOptions),
  express.json(),
  authenticateToken,
  async (req, res) => {
    // Make the function async
    const { userId, message } = req.body;

    if (!userId || !message) {
      return res
        .status(400)
        .send({ error: "Missing userId or message in request body." });
    }

    try {
      const response = await fetch("https://api.line.me/v2/bot/message/push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Ensure LINE_CHANNEL_ACCESS_TOKEN is set in your environment variables
          Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
          to: userId,
          messages: [
            {
              type: "text",
              text: message,
            },
          ],
        }),
      });

      // Check if the LINE API request was successful
      if (response.ok) {
        console.log(`Push message sent to ${userId}`);
        res
          .status(200)
          .send({ success: true, message: "Push message sent successfully." });
      } else {
        const errorData = await response.json();
        console.error(`Failed to send push message to ${userId}:`, errorData);
        res.status(response.status).send({ success: false, error: errorData });
      }
    } catch (error) {
      console.error("Error sending push message:", error);
      res.status(500).send({ success: false, error: "Internal server error." });
    }
  }
);

app.use("/api/user", UserRoute);
app.use("/api/chat", ChatRoute);
app.use("/api/survey", SurveyRoute);
app.use("/api/video", VideoRoute);
app.use("/api/admin", cors(corsOptions), express.json(), AdminRoute);

// register a webhook handler with middleware
// about the middleware, please refer to doc
app.post("/api/callback", lineMiddleware, (req, res) => {
  console.log("Received events:", req.body.events);
  Promise.all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

// The type of `event` is `line.messagingApi.WebhookEvent` from the @line/bot-sdk package.
function handleEvent(event: webhook.Event) {
  if (event.type === "join" || event.type === "follow")
    return handleJoin({ replyToken: event.replyToken });
  if (event.type === "message" && event.message.type === "text") {
    if (event.message.text.trim().toLocaleLowerCase() === "help")
      return handleConfirmMessage({
        replyToken: event.replyToken,
        text: "Need help?",
        actions: [
          { type: "postback", label: "yes", data: "user_need_help" },
          { type: "postback", label: "no", data: "user_no_need_help" },
        ],
      });
    if (event.message.text === "我的身分") {
      return getUserDocumentById(event.source?.userId ?? "").then((user) => {
        if (!user)
          return handleLiffButtonMessage({
            replyToken: event.replyToken,
            liffUrl: process.env.LINE_LIFF_URL!,
            title: "您尚未擁有帳號，點此開始註冊",
            label: "註冊",
          });
        if (user.isLoggedIn) return Promise.resolve(null);
        return handleAlertMessage({
          replyToken: event.replyToken,
          text: `您的身分為『${formatUserRole(
            user.role
          )}』，如需登入，請點選下方按鈕`,
          action: { type: "postback", label: "登入", data: "user_need_login" },
        });
      });
    }
    if (event.message.text === "我的帳號") {
      return getUserDocumentById(event.source?.userId ?? "").then((user) => {
        if (!user || !user.isLoggedIn) return Promise.resolve(null);
        return handleConfirmMessage({
          replyToken: event.replyToken,
          text: "我的帳號",
          actions: [
            {
              type: "uri",
              label: "查看",
              uri: process.env.LINE_LIFF_URL! + "/account.html",
            },
            { type: "postback", label: "登出", data: "user_need_logout" },
          ],
        });
      });
    }
    if (event.message.text === "開始/結束課程") {
      return getUserDocumentById(event.source?.userId ?? "").then(
        async (user) => {
          if (!user || !user.isLoggedIn) return Promise.resolve(null);
          if (await OpenAILib.getCurrentCourse(user))
            return handleAlertMessage({
              replyToken: event.replyToken,
              text: "是否結束目前課程？如需結束，請點選下方按鈕",
              action: {
                type: "postback",
                label: "結束課程",
                data: "user_cancel_task",
              },
            });
          if (user.plan !== "premium")
            return handleTextMessage({
              replyToken: event.replyToken,
              text: "您的方案無法使用此功能，如有疑問，請聯絡系統管理員",
            });
          if (hasUncompletedTask(user))
            return handleTextMessage({
              replyToken: event.replyToken,
              text: "您有未完成的任務，請點選主選單『我的任務』查看，完成任務後才可以開始課程喔",
            });
          if (user.approved !== true)
            return handleTextMessage({
              replyToken: event.replyToken,
              text: "系統管理員為您開通課程後，才可使用此功能喔！如有疑問，請聯絡系統管理員",
            });
          if (!isChapterCompleted(user))
            return handleTextMessage({
              replyToken: event.replyToken,
              text: "您尚未完成第1章的全部課程，請點選主選單『我的任務』查看，所有章節都學習完後才可以開始課程喔",
            });
          return handleAlertMessage({
            replyToken: event.replyToken,
            text: "請點選下方按鈕開始課程",
            action: {
              type: "postback",
              label: "開始課程",
              data: "user_initiate_task",
            },
          });
        }
      );
    }
    if (event.message.text === "學習成果圖卡")
      return getUserDocumentById(event.source?.userId ?? "").then(
        async (user) => {
          if (!user || !user.isLoggedIn) return Promise.resolve(null);
          if (user.approved !== true)
            return handleTextMessage({
              replyToken: event.replyToken,
              text: "系統管理員為您開通課程後，才可使用此功能喔！如有疑問，請聯絡系統管理員",
            });
          if (
            user.role === "parent" &&
            Array.isArray(user.associated_students) &&
            user.associated_students.length > 0
          ) {
            return handleLearningSummaryTargetQuickReply({
              replyToken: event.replyToken,
              userId: user.id,
              associatedStudents: user.associated_students,
            });
          }
          const chatDocs = await getChatDocumentsByUserId(user.id, {
            limit: 5,
          });
          return handleLearningSummaryCarouselMessage({
            replyToken: event.replyToken,
            chats: chatDocs,
          });
        }
      );
    if (event.message.text === "學習記錄")
      return getUserDocumentById(event.source?.userId ?? "").then((user) => {
        if (!user || !user.isLoggedIn) return Promise.resolve(null);
        if (user.approved !== true)
          return handleTextMessage({
            replyToken: event.replyToken,
            text: "系統管理員為您開通課程後，才可使用此功能喔！如有疑問，請聯絡系統管理員",
          });
        return handleConfirmMessage({
          replyToken: event.replyToken,
          text: "請選擇您要如何查看學習記錄",
          actions: [
            {
              type: "uri",
              label: "依日期",
              uri: process.env.LINE_LIFF_URL! + "/chats.html",
            },
            {
              type: "uri",
              label: "依課程",
              uri: process.env.LINE_LIFF_URL! + "/course-list.html",
            },
          ],
        });
      });
    if (event.message.text === "我的任務")
      return getUserDocumentById(event.source?.userId ?? "").then((user) => {
        if (!user || !user.isLoggedIn) return Promise.resolve(null);
        return taskHandler({ user, replyToken: event.replyToken });
      });
    if (event.message.text === "問題回報")
      return getUserDocumentById(event.source?.userId ?? "").then((user) => {
        if (!user || !user.isLoggedIn) return Promise.resolve(null);
        return handleLiffButtonMessage({
          replyToken: event.replyToken,
          liffUrl: process.env.LINE_LIFF_URL! + "/report.html",
          title: "點此回報您的問題",
          label: "回報",
        });
      });

    // handle user click richMenu
    const textMessage = event.message.text;
    if (
      richMenuAArea.find(
        (area) =>
          area.action?.type === "message" && area.action.text === textMessage
      ) ||
      richMenuBArea.find(
        (area) =>
          area.action?.type === "message" && area.action.text === textMessage
      )
    ) {
      return handleTextMessage({
        replyToken: event.replyToken,
        text: "此功能正在開發，敬請期待！",
      });
    }

    // handle user send text message
    return getUserDocumentById(event.source?.userId ?? "").then(
      async (user) => {
        if (user && user.isLoggedIn) {
          if (!limiter.canExecute(user))
            return handleTextMessage({
              replyToken: event.replyToken,
              text: "系統正在回覆您的訊息，請稍後......",
            });
          if (await OpenAILib.getCurrentCourse(user)) {
            if (isFuzzyMatch(textMessage, "Let's call it a day")) {
              return handleAlertMessage({
                replyToken: event.replyToken,
                text: "是否結束目前課程？如需結束，請點選下方按鈕",
                action: {
                  type: "postback",
                  label: "結束課程",
                  data: "user_cancel_task",
                },
              });
            }
            const openAIResult = await OpenAILib.chat({
              user,
              message: textMessage,
            });
            if (openAIResult.success && openAIResult.completed) {
              const threadId = uuidv4();
              try {
                await Promise.all([
                  completeVideoCourse({
                    userId: user.id,
                    name: openAIResult.courseKey,
                    completeQA: true,
                  }),
                  createChat(
                    threadId,
                    user.id,
                    openAIResult.courseKey,
                    openAIResult.history.map((h) => ({
                      role: h.role,
                      text: h.content,
                    })),
                    openAIResult.report
                  ),
                ]);
                return handleLearningSummaryMessage({
                  replyToken: event.replyToken,
                  text: createReportString(openAIResult.report),
                  threadId,
                });
              } catch (error) {
                console.error(error);
                return handleTextMessage({
                  replyToken: event.replyToken,
                  text: `很抱歉，由於系統發生錯誤，課程結束 - ${error}`,
                });
              }
            }
            return handleTextMessage({
              replyToken: event.replyToken,
              text: openAIResult.success
                ? openAIResult.reply
                : `很抱歉，系統目前無法回覆你的訊息 - ${openAIResult.error}`,
            });
          }
          return Promise.resolve(null);
        }
        return Promise.resolve(null);
      }
    );
  }
  if (event.type === "postback") {
    if (event.postback.data === "user_need_help") {
      return handleTextMessage({
        replyToken: event.replyToken,
        text: "Sorry! I can't help you.",
      });
    }
    if (event.postback.data === "user_need_login") {
      return getUserDocumentById(event.source?.userId ?? "").then((user) => {
        if (!user) return Promise.resolve(null);
        logInUser(user.id);
        return handleLinkRichMenuIdToUser({
          richMenuId: readRichMenuBId("richMenuBId"),
          userId: user.id,
          replyToken: event.replyToken,
          successMsg: "您已成功登入",
          failureMsg: "登入失敗，請重新再試",
        });
      });
    }
    if (event.postback.data === "user_need_logout") {
      return getUserDocumentById(event.source?.userId ?? "").then((user) => {
        if (!user) return Promise.resolve(null);
        logOutUser(user.id);
        return handleUnLinkRichMenuIdToUser({
          userId: user.id,
          replyToken: event.replyToken,
          successMsg: "您已成功登出",
          failureMsg: "登出失敗，請重新再試",
        });
      });
    }
    if (event.postback.data === "user_initiate_task") {
      return getUserDocumentById(event.source?.userId ?? "").then(
        async (user) => {
          if (!user || !user.isLoggedIn) return Promise.resolve(null);
          if (await OpenAILib.getCurrentCourse(user))
            return handleTextMessage({
              replyToken: event.replyToken,
              text: "課程已開始",
            });
          return handleLearningQuickReply({
            replyToken: event.replyToken,
            user,
          });
        }
      );
    }
    if (event.postback.data === "user_cancel_task") {
      return getUserDocumentById(event.source?.userId ?? "").then(
        async (user) => {
          if (!user || !user.isLoggedIn) return Promise.resolve(null);
          if (!OpenAILib.getCurrentCourse(user))
            return handleTextMessage({
              replyToken: event.replyToken,
              text: "課程已結束",
            });
          await OpenAILib.deleteChat(user);
          return handleTextMessage({
            replyToken: event.replyToken,
            text: "課程結束",
          });
        }
      );
    }
    if (event.postback.data.startsWith("user_want_learn_grammar:")) {
      return getUserDocumentById(event.source?.userId ?? "").then(
        async (user) => {
          if (!user || !user.isLoggedIn) return Promise.resolve(null);
          if (!limiter.canExecute(user))
            return handleTextMessage({
              replyToken: event.replyToken,
              text: "系統正在回覆您的訊息，請稍後......",
            });
          if (await OpenAILib.getCurrentCourse(user))
            return handleTextMessage({
              replyToken: event.replyToken,
              text: "課程已開始",
            });
          const chapterKey = event.postback.data.replace(
            "user_want_learn_grammar:",
            ""
          );
          if (/^\d+$/.test(chapterKey))
            return handleChapterItemsQuickReply({
              replyToken: event.replyToken,
              chapter: chapterKey,
            });
          if (chapterKey !== "auto" && !VIDEO_PATHS[chapterKey])
            return handleTextMessage({
              replyToken: event.replyToken,
              text: "章節不存在",
            });

          const displayChapter =
            chapterKey === "auto" ? "自訂" : VIDEO_PATHS[chapterKey].title;
          if (chapterKey === "auto")
            return handleTextMessage({
              replyToken: event.replyToken,
              text: [`課程內容：${displayChapter}`, "課程結束"],
            });

          const openAIResult = await OpenAILib.chat({
            user,
            message: `我想學 ${formatCourseKey(chapterKey)} ${
              VIDEO_PATHS[chapterKey].title
            }`,
            courseKey: chapterKey,
          });

          return handleTextMessage({
            replyToken: event.replyToken,
            text: !openAIResult.success
              ? `很抱歉，系統目前無法回覆你的訊息 - ${openAIResult.error}`
              : openAIResult.completed
              ? "課程結束"
              : openAIResult.reply,
          });
        }
      );
    }
    if (event.postback.data.startsWith("user_request_learning_summary_card:"))
      return getUserDocumentById(event.source?.userId ?? "").then(
        async (user) => {
          if (!user || !user.isLoggedIn) return Promise.resolve(null);
          const threadId = event.postback.data.replace(
            "user_request_learning_summary_card:",
            ""
          );
          const chatDoc = await getChatDocumentById(threadId);
          if (!chatDoc)
            return handleTextMessage({
              replyToken: event.replyToken,
              text: "成果圖卡不存在",
            });
          return handleLearningSummaryFlexMessage({
            replyToken: event.replyToken,
            data: chatDoc,
          });
        }
      );
    if (
      event.postback.data.startsWith("user_request_learning_summary_carousel:")
    )
      return getUserDocumentById(event.source?.userId ?? "").then(
        async (user) => {
          if (!user || !user.isLoggedIn) return Promise.resolve(null);
          const payloadString = event.postback.data.replace(
            "user_request_learning_summary_carousel:",
            ""
          );
          const { id, name } = JSON.parse(payloadString || "{}");
          if (!id) return Promise.resolve(null);
          const chatDocs = await getChatDocumentsByUserId(id, { limit: 5 });
          return handleLearningSummaryCarouselMessage({
            replyToken: event.replyToken,
            chats: chatDocs,
            userName: name ? `學生-${name}` : undefined,
          });
        }
      );
    if (event.postback.data.startsWith("user_request_Q&A_practice:"))
      return getUserDocumentById(event.source?.userId ?? "").then(
        async (user) => {
          console.log("user_request_Q&A_practice:");
          if (!user || !user.isLoggedIn) return Promise.resolve(null);
          if (!limiter.canExecute(user))
            return handleTextMessage({
              replyToken: event.replyToken,
              text: "系統正在回覆您的訊息，請稍後......",
            });
          const payloadString = event.postback.data.replace(
            "user_request_Q&A_practice:",
            ""
          );
          const { key, title } = JSON.parse(payloadString || "{}");
          if (!key || !title || !VIDEO_PATHS[key]) return Promise.resolve(null);
          if (
            user.trialed === "completed" &&
            Array.isArray(user.completedVideos) &&
            user.completedVideos.find(
              (v) =>
                v.name === key &&
                Array.isArray(v.submittedRecords) &&
                v.submittedRecords.length > 0 &&
                Array.isArray(v.completedRecords) &&
                v.completedRecords.length > 0
            )
          )
            return handleTextMessage({
              replyToken: event.replyToken,
              text: "課程已完成",
            });

          const openAIResult = await OpenAILib.chat({
            user,
            message: `我想學 ${formatCourseKey(key)} ${VIDEO_PATHS[key].title}`,
            courseKey: key,
          });

          return handleTextMessage({
            replyToken: event.replyToken,
            text: !openAIResult.success
              ? `很抱歉，系統目前無法回覆你的訊息 - ${openAIResult.error}`
              : openAIResult.completed
              ? "課程結束"
              : openAIResult.reply,
          });
        }
      );
  }

  return Promise.resolve(null);
}

if (process.env.NODE_ENV === "development") {
  // // Set static folder
  // // app.use(express.static(__dirname + "/../liff/"));
  app.use(express.static(path.join(__dirname, "../liff")));

  // // Handle SPA
  // // app.get(/.*/, (_, res) => res.sendFile(__dirname + "/../liff/index.html"));
  app.get(/.*/, (_, res) =>
    res.sendFile(path.join(__dirname, "../liff/index.html"))
  );
}

// listen on port
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});
