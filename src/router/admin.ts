import { Router } from "express";
import { handleServiceError } from "../lib/error";
import { getUsers } from "../lib/firebase_admin";
import { getCourseStats, sendJsonResponse } from "../lib/helper";
import { errorHandler } from "../middleware/errorHandler";

const router = Router();

router.use(errorHandler);

router.get("/user/list", async (req, res) => {
  const { page, limit } = req.query;
  try {
    const result = await getUsers({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    sendJsonResponse(res, handleServiceError(error));
  }
});

router.get("/course/stats", async (req, res) => {
  try {
    const result = await getCourseStats();

    res.json({ success: true, data: result });
  } catch (error) {
    sendJsonResponse(res, handleServiceError(error));
  }
});

export default router;
