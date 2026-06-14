import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { Role, User } from "@shared/types";

const COOKIE_NAME = "cb_session";
const SEVEN_DAYS = 7 * 24 * 60 * 60; // seconds

export interface SessionClaims {
  email: string;
  role: Role;
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set.");
  return secret;
}

/** Is this email allowed to edit? (EDITOR_EMAILS is comma-separated.) */
export function isEditorEmail(email: string): boolean {
  const list = (process.env.EDITOR_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.trim().toLowerCase());
}

export function signSession(claims: SessionClaims): string {
  return jwt.sign(claims, getSecret(), { expiresIn: SEVEN_DAYS });
}

export function setSessionCookie(res: Response, token: string): void {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // non-Secure on http://localhost
    sameSite: "lax",
    maxAge: SEVEN_DAYS * 1000,
    path: "/",
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, { path: "/" });
}

/** Read + verify the session cookie. Returns null if absent/invalid. */
export function readSession(req: Request): User | null {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, getSecret()) as SessionClaims;
    return { email: decoded.email, role: decoded.role };
  } catch {
    return null;
  }
}

/**
 * Editor-only guard. 401 if not signed in, 403 if signed in but not an editor.
 *
 * Dev bypass: set DEV_EDITOR_BYPASS=true in .env to skip auth locally (so M4's
 * write flow can be exercised before Google sign-in exists). Never enable in prod.
 */
export function requireEditor(req: Request, res: Response, next: NextFunction): void {
  if (process.env.DEV_EDITOR_BYPASS === "true" && process.env.NODE_ENV !== "production") {
    next();
    return;
  }

  const user = readSession(req);
  if (!user) {
    res.status(401).json({ error: "Please sign in to do that." });
    return;
  }
  if (user.role !== "editor") {
    res.status(403).json({ error: "Only Tyler and Sarah can change recipes." });
    return;
  }
  next();
}

/** Best-effort current editor email for stamping createdBy. */
export function currentEmail(req: Request): string {
  return readSession(req)?.email ?? "editor@cookbook.local";
}
