import cors from "cors";
import express, { Router } from "express";
import { corsOptions } from "../constants/corsOptions";
import {
  createUser,
  getUserDocumentById,
  getUserDocumentByInvitationCode,
} from "../lib/firebase_admin";
import { generateToken } from "../lib/token";
import { generateCode } from "../lib/helper";
import authenticateToken from "../middleware/authenticateToken";
import { auth } from "firebase-admin";

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

router.get(
  "/student/:id",
  cors(corsOptions),
  authenticateToken,
  async (req, res) => {
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: "Missing id" });

    const result = await getUserDocumentById(id);
    res.json({
      data: result ?? null,
    });
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
          token: generateToken({
            id: result.id,
            role: result.role,
            plan: result.plan,
          }),
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
    plan,
    createdAt,
  } = req.body;
  if (!id) return res.status(400).json({ error: "Missing id" });
  if (!name || !originalEmail || !nickName || !email || !role)
    return res.status(400).json({ error: "Missing required fields in body" });

  let final_parent_invitation_code = parent_invitation_code;

  if (role === "parent") {
    let code;
    let existingUser = null;
    do {
      code = generateCode();
      existingUser = await getUserDocumentByInvitationCode(code);
    } while (existingUser);
    final_parent_invitation_code = code;
  }

  const payload = {
    id,
    name,
    originalEmail,
    nickName,
    email,
    role,
    parent_invitation_code: final_parent_invitation_code,
    plan: plan ?? "basic",
    createdAt,
  };
  const result = await createUser(payload);
  res.json(
    result.success
      ? {
          ...result,
          token: generateToken({
            id: payload.id,
          }),
        }
      : result
  );
});

export default router;
