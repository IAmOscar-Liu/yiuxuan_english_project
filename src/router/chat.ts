import cors from "cors";
import express, { Router } from "express";
import { corsOptions } from "../constants/corsOptions";
import {
  getChatDocumentById,
  getChatDocumentsByUserId,
} from "../lib/firebase_admin";
import authenticateToken from "../middleware/authenticateToken";

const router = Router();

router.get(
  "/list/:userId",
  cors(corsOptions),
  express.json(),
  authenticateToken,
  async (req, res) => {
    const userId = req.params.userId;
    const { startDate, endDate } = req.query;
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    const result = await getChatDocumentsByUserId(userId, {
      startDate: typeof startDate === "string" ? startDate : undefined,
      endDate: typeof endDate === "string" ? endDate : undefined,
    });
    res.json({ data: result });
  }
);

router.get("/:id", cors(corsOptions), authenticateToken, async (req, res) => {
  const id = req.params.id;
  if (!id) return res.status(400).json({ error: "Missing id" });

  const result = await getChatDocumentById(id);
  res.json({ data: result ?? null });
});

export default router;
