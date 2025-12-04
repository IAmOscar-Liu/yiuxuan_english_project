import {
  SYSTEM_PROMPT_CH01_0,
  SYSTEM_PROMPT_CH01_A,
  SYSTEM_PROMPT_CH01_B,
  SYSTEM_PROMPT_CH01_C,
  SYSTEM_PROMPT_CH01_D,
} from "../assets/courses";

// Map survey name -> file path inside the bucket
export const SURVEY_PATHS: Record<
  string,
  { phase: string; title: string; file: string; baseFolder: string }
> = {
  profile: {
    phase: "1",
    title: "填寫個人基本資料",
    file: "surveys/1_基本資料/survey_template.json",
    baseFolder: "surveys/1_基本資料",
  },
  satisfaction_with_life_scale: {
    phase: "1",
    title: "填寫生活滿意度量表",
    file: "surveys/2_生活滿意度量表/satisfaction_with_life_scale.json",
    baseFolder: "surveys/2_生活滿意度量表",
  },
  learned_helplessness_scale: {
    phase: "1",
    title: "填寫習得性無助量表",
    file: "surveys/3_習得性無助量表/learned_helplessness_scale.json",
    baseFolder: "surveys/3_習得性無助量表",
  },
  hope_scale: {
    phase: "2",
    title: "填寫希望量表",
    file: "surveys/4_希望量表/hope_scale.json",
    baseFolder: "surveys/4_文法專屬自我效能量表",
  },
  grammar_self_efficacy: {
    phase: "2",
    title: "填寫文法自我效能量表",
    file: "surveys/5_文法自我效能量表/grammar_self_efficacy.json",
    baseFolder: "surveys/5_文法自我效能量表",
  },
};

export const VIDEO_PATHS: Record<
  string,
  { title: string; jsonPath: string; videoPath: string; content: string }
> = {
  chapter_1_0: {
    title: "助動詞總論",
    jsonPath: "videos/chapter_1_0.json",
    videoPath: "videos/chapter_1_0.mp4",
    content: SYSTEM_PROMPT_CH01_0,
  },
  chapter_1_A: {
    title: "文法類助動詞",
    jsonPath: "videos/chapter_1_A.json",
    videoPath: "videos/chapter_1_A.mp4",
    content: SYSTEM_PROMPT_CH01_A,
  },
  chapter_1_B: {
    title: "情態類助動詞",
    jsonPath: "videos/chapter_1_B.json",
    videoPath: "videos/chapter_1_B.mp4",
    content: SYSTEM_PROMPT_CH01_B,
  },
  chapter_1_C: {
    title: "助動詞片語互換",
    jsonPath: "videos/chapter_1_C.json",
    videoPath: "videos/chapter_1_C.mp4",
    content: SYSTEM_PROMPT_CH01_C,
  },
  chapter_1_D: {
    title: "推測與過去推論",
    jsonPath: "videos/chapter_1_D.json",
    videoPath: "videos/chapter_1_D.mp4",
    content: SYSTEM_PROMPT_CH01_D,
  },
  // chapter_2_2: {
  //   title: "連接詞",
  //   jsonPath: "videos/chapter_2_2.json",
  //   videoPath: "videos/chapter_2_2.mp4",
  // },
  // chapter_2_3: {
  //   title: "比較級與最高級",
  //   jsonPath: "videos/chapter_2_3.json",
  //   videoPath: "videos/chapter_2_3.mp4",
  // },
  // chapter_2_4: {
  //   title: "冠詞",
  //   jsonPath: "videos/chapter_2_4.json",
  //   videoPath: "videos/chapter_2_4.mp4",
  // },
};

export const COURSE_INFO = {
  1: {
    title: "第1章：助動詞",
    contents: [
      "chapter_1_0",
      "chapter_1_A",
      "chapter_1_B",
      "chapter_1_C",
      "chapter_1_D",
    ],
  },
  // 2: {
  //   title: "第2章：其他",
  //   contents: ["chapter_2_1", "chapter_2_2", "chapter_2_3", "chapter_2_4"],
  // },
};
