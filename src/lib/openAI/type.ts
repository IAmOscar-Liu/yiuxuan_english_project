export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type Report = {
  complete: boolean;
  topic: string;
  summary: string;
  comment: string;
  involvedKnowledge: string;
  score: number;
};

export type OpenAIResult =
  | { success: true; completed: false; reply: string }
  | {
      success: true;
      completed: true;
      report: Report;
      courseKey: string;
      history: ChatMessage[];
    }
  | { success: false; error: any };
