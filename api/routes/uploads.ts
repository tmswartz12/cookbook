import { Router } from "express";
import { requireEditor } from "../lib/auth";
import { signUpload } from "../lib/cloudinary";

const router = Router();

// POST /api/uploads/sign — editor-only Cloudinary signed-upload params.
router.post("/sign", requireEditor, (_req, res, next) => {
  try {
    res.json(signUpload());
  } catch (err) {
    next(err);
  }
});

export default router;
