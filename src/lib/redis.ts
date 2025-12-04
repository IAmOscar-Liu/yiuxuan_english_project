import Redis from "ioredis";
import { ChatMessage } from "./openAI/type";

// Initialize the Redis client (assuming 'redis' variable is available)
const redis = new Redis({
  host: "127.0.0.1",
  port: 6379,
});

// Time-To-Live (TTL) in seconds (3 hours)
const THREE_HOURS_IN_SECONDS = 10800;

class RedisLib {
  // --- Chat History Functions ---

  /**
   * Adds a new message to history, and resets TTL for both history and chapter.
   */
  static async addChatMessage(
    userId: string,
    message: ChatMessage
  ): Promise<void> {
    const historyKey = `chat:history:${userId}`;
    const chapterKey = `user:chapter:${userId}`;
    const messageString = JSON.stringify(message);

    // Use a Redis Pipeline for atomic execution and efficiency
    await redis
      .multi()
      .rpush(historyKey, messageString) // 1. Add the message
      .expire(historyKey, THREE_HOURS_IN_SECONDS) // 2. Reset history TTL
      .expire(chapterKey, THREE_HOURS_IN_SECONDS) // 3. Reset chapter TTL (Synchronization)
      .exec();
  }

  /**
   * Retrieves the entire chat history for a user (Read) and resets its TTL.
   */
  static async getChatHistory(userId: string): Promise<ChatMessage[]> {
    const key = `chat:history:${userId}`;

    try {
      // Await the pipeline result (an array of two-element tuples)
      const result = await redis
        .multi()
        .lrange(key, 0, -1) // Command 1
        .expire(key, THREE_HOURS_IN_SECONDS) // Command 2
        .exec();

      if (!result) return [];

      // Get the result of the first command (LRANGE) -> [0]
      // Get the actual data (result part of the tuple) -> [1]
      const historyStrings = result[0][1] as string[] | null;

      // Check for errors (optional, but recommended for robustness)
      // if (result[0][0]) {
      //   throw result[0][0];
      // }

      return historyStrings ? historyStrings.map((str) => JSON.parse(str)) : [];
    } catch (e) {
      return [];
    }
  }

  // --- User Chapter Functions ---

  /**
   * Sets the current chapter for a user (Write) and sets the expiration.
   */
  static async setChapter(userId: string, chapterId: string): Promise<void> {
    const key = `user:chapter:${userId}`;
    // SET with EX option sets the value AND the expiration atomically
    await redis.set(key, chapterId, "EX", THREE_HOURS_IN_SECONDS);
  }

  /**
   * Retrieves the current chapter for a user (Read) and resets its TTL.
   */
  static async getChapter(userId: string): Promise<string | null> {
    const key = `user:chapter:${userId}`;

    try {
      // Await the pipeline result (an array of two-element tuples)
      const result = await redis
        .multi()
        .get(key) // Command 1
        .expire(key, THREE_HOURS_IN_SECONDS) // Command 2
        .exec();

      if (!result) return null;

      // Get the result of the first command (GET) -> [0]
      // Get the actual data (result part of the tuple) -> [1]
      const chapterId = result[0][1] as string | null;

      // Check for errors (optional)
      // if (result[0][0]) {
      //   throw result[0][0];
      // }

      return chapterId;
    } catch (e) {
      return null;
    }
  }

  /**
   * Deletes the entire chat history and the user's current chapter (Full Cleanup).
   * @param userId The ID of the user.
   */
  static async deleteChatHistory(userId: string): Promise<void> {
    const historyKey = `chat:history:${userId}`;
    const chapterKey = `user:chapter:${userId}`;

    // Use a pipeline to ensure both keys are deleted in a single transaction
    await redis
      .multi()
      .del(historyKey) // Deletes the chat history List
      .del(chapterKey) // Deletes the user chapter String
      .exec();
    // The result of .exec() can be ignored as we only care that the operation completes.
  }

  /**
   * Deletes only the user's current chapter.
   * @param userId The ID of the user.
   */
  static async deleteChapter(userId: string): Promise<void> {
    const key = `user:chapter:${userId}`;
    await redis.del(key);
  }

  /**
   * ⚠️ DANGER ZONE: Clears ALL keys from the currently selected Redis database.
   * Use with extreme caution, typically only in development or testing environments.
   */
  static async clearAllRedisData(): Promise<void> {
    await redis.flushdb();
    console.log("Redis database flushed successfully.");
  }
}

export default RedisLib;
