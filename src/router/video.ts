import cors from "cors";
import express, { Router } from "express";
import { corsOptions } from "../constants/corsOptions";
import { COURSE_INFO, VIDEO_PATHS } from "../constants/courseInfo";
import { completeVideoCourse } from "../lib/firebase_admin";
import { getDownloadUrl, readJson } from "../lib/firebase_bucket";
import authenticateToken from "../middleware/authenticateToken";

const router = Router();

router.get("/list", authenticateToken, (req, res) => {
  const data = Object.keys(VIDEO_PATHS).map((key) => ({
    title: VIDEO_PATHS[key].title,
    name: key,
  }));
  res.json(data);
});

router.post(
  "/list-available",
  cors(corsOptions),
  authenticateToken,
  express.json(),
  (req, res) => {
    try {
      const { completedVideos, plan, all } = req.body ?? {};
      const result: Record<
        string,
        {
          title: string;
          data: Array<{
            key: string;
            data: { title: string; jsonPath: string; videoPath: string };
          }>;
        }
      > = {};

      // Helper to build payload for a group
      const buildGroupPayload = (groupKey: string) => {
        const group =
          COURSE_INFO[groupKey as unknown as keyof typeof COURSE_INFO];
        if (!group) return;

        const data = group.contents.map((chapterId) => ({
          key: chapterId,
          data: VIDEO_PATHS[chapterId],
        }));

        result[groupKey] = { title: group.title, data };
      };

      if (plan === "premium" || all === true) {
        Object.keys(COURSE_INFO).forEach((gk) => buildGroupPayload(gk));
        return res.json(result);
      }

      // If empty → default to group 1
      if (!Array.isArray(completedVideos) || completedVideos.length === 0) {
        buildGroupPayload("1");
        return res.json(result);
      }

      const completedNames = new Set<string>(
        completedVideos
          .filter(
            (v) =>
              v.name &&
              Array.isArray(v.submittedRecords) &&
              v.submittedRecords.length > 0 &&
              Array.isArray(v.completedRecords) &&
              v.completedRecords.length > 0
          )
          .map((v: any) => v?.name)
          .filter((n: any) => typeof n === "string" && n.trim().length > 0)
      );

      const groupKeys = Object.keys(COURSE_INFO).sort(
        (a, b) => Number(a) - Number(b)
      );
      let unlockedGroups = new Set<string>();

      // Step 1: unlock groups where user has at least one completed video
      groupKeys.forEach((gk) => {
        const group = COURSE_INFO[gk as unknown as keyof typeof COURSE_INFO];
        const hasAnyCompleted = group.contents.some((c) =>
          completedNames.has(c)
        );
        if (hasAnyCompleted) unlockedGroups.add(gk);
      });

      // Step 2: progression logic — if user completed ALL contents in a group, unlock the NEXT one
      groupKeys.forEach((gk, idx) => {
        const group = COURSE_INFO[gk as unknown as keyof typeof COURSE_INFO];
        const allCompleted = group.contents.every((c) => completedNames.has(c));
        if (allCompleted) {
          const nextKey = groupKeys[idx + 1];
          if (nextKey) unlockedGroups.add(nextKey);
        }
      });

      // If no groups unlocked, default to group 1
      if (unlockedGroups.size === 0) {
        buildGroupPayload("1");
      } else {
        unlockedGroups.forEach((gk) => buildGroupPayload(gk));
      }

      return res.json(result);
    } catch (err) {
      console.error("/list-available error:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

router.get("/:name", cors(corsOptions), authenticateToken, async (req, res) => {
  const name = req.params.name;
  const path = VIDEO_PATHS[name];
  if (!path) return res.status(404).json({ error: "Unknown Video" });
  console.log(`[GET video]name: ${name}, path: ${path.videoPath}`);

  try {
    const [json, downloadUrl] = await Promise.all([
      readJson(path.jsonPath),
      getDownloadUrl(path.videoPath),
    ]);

    res.set("Content-Type", "application/json; charset=utf-8");
    res.set("Cache-Control", "public, max-age=60"); // small dev cache
    res.json({
      ...json,
      videoUrl: downloadUrl,
    });
  } catch (err) {
    console.error("Video fetch failed:", err);
    res.status(500).json({ error: "Failed to load video JSON" });
  }
});

router.post(
  "/:name",
  cors(corsOptions),
  authenticateToken,
  express.json(),
  async (req, res) => {
    try {
      const { name } = req.params; // "profile" | "formal_scale_sections"
      if (!name) return res.status(400).json({ error: "Missing name" });

      const { userId, submitted } = req.body || {};

      console.log(
        `[POST video]name: ${name}, userId: ${userId}${
          !!submitted ? " , submittedAt:" + new Date().toISOString() : ""
        }`
      );

      if (!userId) {
        return res.status(400).json({ error: "Missing userId" });
      }

      const path = VIDEO_PATHS[name];

      if (!path) {
        return res.status(400).json({ error: `Unknown name: ${name}` });
      }

      await completeVideoCourse({
        userId,
        name,
        submitted: !!submitted,
      });

      res.json({ ok: true });
    } catch (err) {
      console.error("Save Video failed:", err);
      res.status(500).json({ error: "Save failed" });
    }
  }
);

export default router;
