import { Router } from "express";
import rateLimit from "express-rate-limit";
import { OAuth2Client } from "google-auth-library";
import {
  clearSessionCookie,
  isEditorEmail,
  readSession,
  setSessionCookie,
  signSession,
} from "../lib/auth";
import type { Role } from "@shared/types";

const router = Router();

// Verify lazily so a missing client id surfaces a clear error at call time.
function getClient(): OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error("GOOGLE_CLIENT_ID is not set.");
  return new OAuth2Client(clientId);
}

// Throttle sign-in attempts.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/auth/google — verify the Google credential, issue our session cookie.
router.post("/google", loginLimiter, async (req, res, next) => {
  try {
    const credential = req.body?.credential;
    if (typeof credential !== "string" || !credential) {
      res.status(400).json({ error: "Missing Google credential." });
      return;
    }

    const client = getClient();
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = payload?.email;
    if (!email || !payload?.email_verified) {
      res.status(401).json({ error: "Could not verify your Google account." });
      return;
    }

    // Everyone who signs in gets a session; only allowlisted emails are editors.
    const role: Role = isEditorEmail(email) ? "editor" : "viewer";
    const token = signSession({ email, role });
    setSessionCookie(res, token);
    res.json({ email, role });
  } catch (err) {
    // Token verification failures shouldn't 500.
    if (err instanceof Error && /token|audience|verify/i.test(err.message)) {
      res.status(401).json({ error: "Sign-in failed. Please try again." });
      return;
    }
    next(err);
  }
});

// GET /api/auth/me — current user or null. Public (no DB needed).
router.get("/me", (req, res) => {
  res.json(readSession(req));
});

// POST /api/auth/logout — clear the cookie.
router.post("/logout", (_req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

export default router;
