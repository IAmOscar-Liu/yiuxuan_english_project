// Map survey name -> file path inside the bucket
export const SURVEY_PATHS: Record<
  string,
  { title: string; file: string; baseFolder: string }
> = {
  profile: {
    title: "填寫個人基本資料",
    file: "surveys/1_基本資料/survey_template.json",
    baseFolder: "surveys/1_基本資料",
  },
  formal_scale_sections: {
    title: "填寫量表內容",
    file: "surveys/2_正式量表內容/formal_scale_sections.json",
    baseFolder: "surveys/2_正式量表內容",
  },
  satisfaction_with_life_scale: {
    title: "填寫生活滿意度量表",
    file: "surveys/3_生活滿意度量表/satisfaction_with_life_scale.json",
    baseFolder: "surveys/3_生活滿意度量表",
  },
  children_attributional_style_questionaire: {
    title: "填寫兒童歸因風格問卷",
    file: "surveys/4_兒童歸因風格問卷/children_attributional_style_questionaire.json",
    baseFolder: "surveys/4_兒童歸因風格問卷",
  },
  grammar_specific_self_efficacy_scale: {
    title: "填寫文法專屬自我效能量表",
    file: "surveys/5_文法專屬自我效能量表/grammar_specific_self_efficacy_scale.json",
    baseFolder: "surveys/5_文法專屬自我效能量表",
  },
};

export const VIDEO_PATHS: Record<
  string,
  { title: string; jsonPath: string; videoPath: string }
> = {
  chapter_1_1: {
    title: "現在簡單式",
    jsonPath: "videos/chapter_1_1.json",
    videoPath: "videos/chapter_1_1.mp4",
  },
  chapter_1_2: {
    title: "過去式",
    jsonPath: "videos/chapter_1_2.json",
    videoPath: "videos/chapter_1_2.mp4",
  },
  chapter_1_3: {
    title: "未來式",
    jsonPath: "videos/chapter_1_3.json",
    videoPath: "videos/chapter_1_3.mp4",
  },
  chapter_1_4: {
    title: "現在進行式",
    jsonPath: "videos/chapter_1_4.json",
    videoPath: "videos/chapter_1_4.mp4",
  },
  chapter_2_1: {
    title: "助動詞",
    jsonPath: "videos/chapter_2_1.json",
    videoPath: "videos/chapter_2_1.mp4",
  },
  chapter_2_2: {
    title: "連接詞",
    jsonPath: "videos/chapter_2_2.json",
    videoPath: "videos/chapter_2_2.mp4",
  },
  chapter_2_3: {
    title: "比較級與最高級",
    jsonPath: "videos/chapter_2_3.json",
    videoPath: "videos/chapter_2_3.mp4",
  },
  chapter_2_4: {
    title: "冠詞",
    jsonPath: "videos/chapter_2_4.json",
    videoPath: "videos/chapter_2_4.mp4",
  },
};

export const COURSE_INFO = {
  1: {
    title: "第1章：時態",
    contents: ["chapter_1_1", "chapter_1_2", "chapter_1_3", "chapter_1_4"],
  },
  2: {
    title: "第2章：其他",
    contents: ["chapter_2_1", "chapter_2_2", "chapter_2_3", "chapter_2_4"],
  },
};
