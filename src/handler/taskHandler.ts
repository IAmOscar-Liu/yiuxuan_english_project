import {
  COURSE_INFO,
  SURVEY_PATHS,
  VIDEO_PATHS,
} from "../constants/courseInfo";
import { handleAlertMessage } from "./alertMessage";
import { handleConfirmMessage } from "./confirmMessage";
import { handleLiffButtonMessage } from "./LiffButtonMessage";

export async function taskHandler({
  replyToken,
  user,
}: {
  replyToken?: string;
  user: { [key: string]: any };
}) {
  const noTaskMessage =
    "您目前沒有任務在身，點選主選單『開始/結束課程』開始學習吧！";

  if (!replyToken) return Promise.resolve(null);
  //   if (user.role != "student")
  //     return handleTextMessage({ text: noTaskMessage, replyToken });
  if (!isSurveyCompleted(user))
    return handleLiffButtonMessage({
      replyToken,
      liffUrl: process.env.LINE_LIFF_URL! + "/survey-list.html",
      title: "您有尚未完成的問卷",
      label: "填寫問卷",
    });
  // if (!isVideoCourseCompleted(user))
  //   return handleLiffButtonMessage({
  //     replyToken,
  //     liffUrl: process.env.LINE_LIFF_URL! + "/video-list.html",
  //     title: "您有尚未完成的影片課程",
  //     label: "前往課程",
  //   });
  const nextAICourse = getNextAICourse(user);
  if (nextAICourse) {
    const formattedKey = formatCourseKey(nextAICourse.key);
    return handleConfirmMessage({
      replyToken,
      text: `您已完成『${formattedKey} ${nextAICourse.data.title}』\n點選下方『問答練習』來進一步提升學習成效吧！ `,
      actions: [
        {
          type: "postback",
          label: "問答練習",
          data: `user_request_Q&A_practice:${JSON.stringify({
            key: nextAICourse.key,
            title: nextAICourse.data.title,
          })}`,
        },
        {
          type: "uri",
          label: "查看所有課程",
          uri: process.env.LINE_LIFF_URL! + "/video-list.html",
        },
      ],
    });
  }
  if (user.plan === "premium") {
    return handleAlertMessage({
      replyToken,
      text: "請選擇課程",
      action: {
        type: "uri",
        label: "查看所有課程",
        uri: process.env.LINE_LIFF_URL! + "/video-list.html",
      },
    });
  }
  const nextCourse = getNextVideoCourse(user);
  if (nextCourse) {
    const formattedKey = formatCourseKey(nextCourse.key);
    return handleConfirmMessage({
      replyToken,
      text: `您的下一個課程：\n${formattedKey} ${nextCourse.data.title}`,
      actions: [
        {
          type: "uri",
          label: "前往課程",
          uri:
            process.env.LINE_LIFF_URL! +
            `/video.html?userId=${user.id}&name=${encodeURIComponent(
              nextCourse.key
            )}&closeWindowOnSuccess=true`,
        },
        {
          type: "uri",
          label: "查看所有課程",
          uri: process.env.LINE_LIFF_URL! + "/video-list.html",
        },
      ],
    });
  }
  return handleAlertMessage({
    replyToken,
    text: noTaskMessage,
    action: {
      type: "uri",
      label: "查看所有課程",
      uri: process.env.LINE_LIFF_URL! + "/video-list.html",
    },
  });
}

export function isSurveyCompleted(user: { [key: string]: any }) {
  const completedSurveys = user.completedSurveys;
  if (!Array.isArray(completedSurveys) || completedSurveys.length === 0)
    return false;
  const nameSet = new Set(
    completedSurveys
      .map((survey) => survey.name)
      .filter((v) => typeof v === "string" && v.length > 0)
  );
  return Object.keys(SURVEY_PATHS).every((name) => nameSet.has(name));
}

export function isVideoCourseCompleted(user: { [key: string]: any }) {
  const completedVideos = user.completedVideos;
  if (!Array.isArray(completedVideos) || completedVideos.length === 0)
    return false;
  const nameSet = new Set(
    completedVideos
      .filter(
        (video) =>
          video.name &&
          Array.isArray(video.submittedRecords) &&
          video.submittedRecords.length > 0
      )
      .map((video) => video.name)
      .filter((v) => typeof v === "string" && v.length > 0)
  );
  return Object.keys(VIDEO_PATHS).every((name) => nameSet.has(name));
}

export function isChapterCompleted(
  user: { [key: string]: any },
  chapter: keyof typeof COURSE_INFO = 1
) {
  const completedVideos = user.completedVideos;
  if (!Array.isArray(completedVideos) || completedVideos.length === 0)
    return false;
  const nameSet = new Set(
    completedVideos
      .filter(
        (video) =>
          video.name &&
          Array.isArray(video.submittedRecords) &&
          video.submittedRecords.length > 0 &&
          Array.isArray(video.completedRecords) &&
          video.completedRecords.length > 0
      )
      .map((video) => video.name)
      .filter((v) => typeof v === "string" && v.length > 0)
  );
  return COURSE_INFO[chapter].contents.every((name) => nameSet.has(name));
}

export function hasUncompletedTask(user: { [key: string]: any }) {
  // if (user.role != "student") return false;
  if (!isSurveyCompleted(user)) return true;
  return false;
}

export function getNextVideoCourse(user: { [key: string]: any }) {
  try {
    console.log("getNextVideoCourse");
    if (!Array.isArray(user.completedVideos))
      return { key: "chapter_1_1", data: VIDEO_PATHS["chapter_1_1"] };

    const completedVideoSet = new Set(
      user.completedVideos
        .filter(
          (v) =>
            v.name &&
            Array.isArray(v.submittedRecords) &&
            v.submittedRecords.length > 0 &&
            Array.isArray(v.completedRecords) &&
            v.completedRecords.length > 0
        )
        .map((v) => v.name)
        .filter((v) => typeof v === "string" && v.length > 0)
    );

    // console.log("completedVideoSet", completedVideoSet);

    const videoKeys = Object.keys(VIDEO_PATHS);
    let lastIdx = -1;
    for (let i = videoKeys.length - 1; i >= 0; i--) {
      if (completedVideoSet.has(videoKeys[i])) {
        lastIdx = i;
        break;
      }
    }

    if (lastIdx === -1)
      return { key: "chapter_1_1", data: VIDEO_PATHS["chapter_1_1"] };
    if (lastIdx === videoKeys.length - 1) return null;

    return {
      key: videoKeys[lastIdx + 1],
      data: VIDEO_PATHS[videoKeys[lastIdx + 1]],
    };
  } catch (e) {
    return { key: "chapter_1_1", data: VIDEO_PATHS["chapter_1_1"] };
  }
}

export function getNextAICourse(user: { [key: string]: any }) {
  try {
    if (!Array.isArray(user.completedVideos)) return null;

    const completedVideoSet = new Set(
      user.completedVideos
        .filter(
          (v) =>
            v.name &&
            Array.isArray(v.submittedRecords) &&
            v.submittedRecords.length > 0 &&
            (!Array.isArray(v.completedRecords) ||
              v.completedRecords.length === 0)
        )
        .map((v) => v.name)
        .filter((v) => typeof v === "string" && v.length > 0)
    );

    const videoKeys = Object.keys(VIDEO_PATHS);
    let lastIdx = -1;
    for (let i = 0; i < videoKeys.length; i++) {
      if (completedVideoSet.has(videoKeys[i])) {
        lastIdx = i;
        break;
      }
    }

    if (lastIdx === -1) return null;

    return { key: videoKeys[lastIdx], data: VIDEO_PATHS[videoKeys[lastIdx]] };
  } catch (e) {
    return null;
  }
}

export function formatCourseKey(key: string) {
  return key.replace("chapter_", "").replace("_", "-");
}

export function getFirstPart(str: string) {
  // Split by "-" and take the first element
  const first = str.split("-")[0];
  return parseInt(first, 10);
}
