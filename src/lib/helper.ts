import { COURSE_INFO, VIDEO_PATHS } from "../constants/courseInfo";
import { ServiceResponse } from "../types";
import { getUsers } from "./firebase_admin";
import { Response } from "express";

export function sendJsonResponse<T>(res: Response, result: ServiceResponse<T>) {
  res.status(result.statusCode ?? 200).json(result);
}

// Helper: generate 5-7 char code (A-Z, 0-9)
export function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const len = Math.floor(Math.random() * 3) + 5; // 5~7
  let code = "";
  for (let i = 0; i < len; i++)
    code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function getCourseStats() {
  // 1. Fetch all users. A high limit is used to get all users at once.
  const { items: allUsers } = await getUsers({ limit: 999999 });

  // 2. Initialize a map to store stats for each video course.
  const courseStats: Record<
    string,
    { watchCount: number; submitCount: number; completeCount: number }
  > = {};
  Object.keys(VIDEO_PATHS).forEach((key) => {
    courseStats[key] = {
      watchCount: 0,
      submitCount: 0,
      completeCount: 0,
    };
  });

  // 3. Iterate over all users and aggregate video completion data.
  allUsers.forEach((user) => {
    if (Array.isArray(user.completedVideos)) {
      user.completedVideos.forEach((video: any) => {
        if (video.name && courseStats[video.name]) {
          courseStats[video.name].watchCount +=
            video.watchedRecords?.length || 0;
          courseStats[video.name].submitCount +=
            video.submittedRecords?.length || 0;
          courseStats[video.name].completeCount +=
            video.completedRecords?.length || 0;
        }
      });
    }
  });

  // 4. Format the result to match the desired output structure.
  const result = Object.entries(COURSE_INFO).reduce((acc, [key, value]) => {
    acc[key] = {
      ...value,
      contents: value.contents.map((videoKey) => ({
        name: videoKey,
        title: VIDEO_PATHS[videoKey].title,
        ...courseStats[videoKey],
      })),
    };
    return acc;
  }, {} as Record<string, any>);

  return result;
}
