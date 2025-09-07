import cors from "cors";
import express, { Router } from "express";
import { corsOptions } from "../constants/corsOptions";
import {
  createUser,
  getUserDocumentById,
  getUserDocumentByInvitationCode,
} from "../lib/firebase_admin";
import { generateToken } from "../lib/token";

const router = Router();

router.get(
  "/parent/:parent_invitation_code",
  cors(corsOptions),
  async (req, res) => {
    const parentInvitationCode = req.params.parent_invitation_code;
    if (!parentInvitationCode)
      return res.status(400).json({ error: "Missing parentInvitationCode" });

    const result = await getUserDocumentByInvitationCode(parentInvitationCode);
    res.json({ data: result ?? null });
  }
);

router.get("/:id", cors(corsOptions), async (req, res) => {
  const id = req.params.id;
  if (!id) return res.status(400).json({ error: "Missing id" });

  const result = await getUserDocumentById(id);
  res.json({
    data: result
      ? {
          ...result,
          token: generateToken({ id: result.id }),
        }
      : null,
  });
});

router.post("/:id", cors(corsOptions), express.json(), async (req, res) => {
  const id = req.params.id;
  const {
    name,
    originalEmail,
    nickName,
    email,
    role,
    parent_invitation_code,
    createdAt,
  } = req.body;
  if (!id) return res.status(400).json({ error: "Missing id" });
  if (
    !name ||
    !originalEmail ||
    !nickName ||
    !email ||
    !role ||
    !parent_invitation_code
  )
    return res.status(400).json({ error: "Missing required fields in body" });

  const payload = {
    id,
    name,
    originalEmail,
    nickName,
    email,
    role,
    parent_invitation_code,
    createdAt,
  };
  const result = await createUser(payload);
  res.json(
    result.success
      ? { ...result, token: generateToken({ id: payload.id }) }
      : result
  );
});

export default router;
