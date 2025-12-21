import OpenAI from "openai";
import { VIDEO_PATHS } from "../../constants/courseInfo";
import { limiter } from "../rateLimit";
import RedisLib from "../redis";
import { OpenAIResult } from "./type";
import { tryParseReport } from "./utils";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY as string,
});

// In-memory chat history per user
// const userHistories: Record<string, ChatMessage[]> = {};
// const userChapter: Record<string, string> = {};

export class OpenAILib {
  static async getCurrentCourse(user: { [field: string]: any }) {
    const userId = user.id;
    // const chapter = userChapter[userId];
    const chapter = await RedisLib.getChapter(userId);
    return chapter;
  }

  static async deleteChat(user: { [field: string]: any }) {
    const userId = user.id;
    // delete userHistories[userId];
    // delete userChapter[userId];
    await RedisLib.deleteChatHistory(userId);
  }

  static async chat({
    user,
    message,
    courseKey,
  }: {
    user: {
      [field: string]: any;
    };
    message: string;
    courseKey?: string;
  }): Promise<OpenAIResult> {
    console.log(`userId ${user.id} message: ${message}`);
    try {
      limiter.execute(user);

      const userId = user.id;

      // let currentCourse = userChapter[userId];
      let currentCourse = await RedisLib.getChapter(userId);
      if (!currentCourse && courseKey) {
        // userChapter[userId] = courseKey;
        await RedisLib.setChapter(userId, courseKey);
        currentCourse = courseKey;
      }
      if (!currentCourse) {
        return {
          success: false,
          error: "No chapter found for this user",
        };
      }
      const SYSTEM_PROMPT = VIDEO_PATHS[currentCourse]?.content;
      if (!SYSTEM_PROMPT) {
        return {
          success: false,
          error: "No system prompt found for this chapter",
        };
      }

      // init history
      // if (!userHistories[userId]) {
      //   userHistories[userId] = [];
      // }

      // push user message
      // userHistories[userId].push({
      //   role: "user",
      //   content: message,
      // });
      await RedisLib.addChatMessage(userId, {
        role: "user",
        content: message,
      });
      const userHistories = await RedisLib.getChatHistory(userId);
      // console.log(`userId ${userId} history`, userHistories);

      // system + history as Responses input
      const input = [
        {
          role: "system" as const,
          content: SYSTEM_PROMPT,
        },
        ...userHistories.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      ];

      const response = await openai.responses.create({
        // model: "gpt-4.1", // or "gpt-4.1" if you prefer
        model: "gpt-5.1", // or "gpt-4.1" if you prefer
        input,
      });

      // Assistant text (combined)
      const assistantText = response.output_text || "";

      // Try to parse as report JSON
      const report = tryParseReport(assistantText);

      if (report) {
        console.log(`user ${userId} got report`);
        setTimeout(() => {
          OpenAILib.deleteChat(user);
        }, 0);
        return {
          success: true,
          completed: true,
          courseKey: currentCourse,
          report,
          history: userHistories,
        };
      }

      // Save assistant message into history (store raw text)
      // userHistories[userId].push({
      //   role: "assistant",
      //   content: assistantText,
      // });
      await RedisLib.addChatMessage(userId, {
        role: "assistant",
        content: assistantText,
      });

      console.log(`userId ${userId} reply: ${assistantText}`);
      return {
        success: true,
        completed: false,
        reply: assistantText,
      };
    } catch (err: any) {
      return {
        success: false,
        error: `很抱歉，系統目前無法回覆你的訊息 - ${err}`,
      };
    } finally {
      limiter.finish(user);
    }
  }
}
