import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { connectDB } from "./lib/db";
import recipesRouter, { tagsRouter } from "./routes/recipes";
import authRouter from "./routes/auth";
import uploadsRouter from "./routes/uploads";
import { ogRouter } from "./routes/og";

const app = express();

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";

// CSP is disabled: the SPA shell (served statically and, for /recipe/:slug, by
// the OG route below) loads Google Fonts, the GIS script, and Cloudinary
// images. Helmet's default CSP would block those; keep the other hardening.
app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// Ensure a (cached) DB connection before handlers that need it. The health
// check (reports status itself) and the auth routes (cookie/token only, no DB)
// are exempt so they keep working even if Atlas is briefly unreachable.
const DB_EXEMPT = ["/api/health", "/api/auth"];
app.use(async (req, res, next) => {
  if (DB_EXEMPT.some((p) => req.path.startsWith(p))) return next();
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("DB connection failed:", err);
    res.status(503).json({ error: "Database unavailable. Try again shortly." });
  }
});

app.get("/api/health", async (_req, res) => {
  let db = "unknown";
  try {
    await connectDB();
    db = "connected";
  } catch {
    db = "disconnected";
  }
  res.json({ ok: true, db, time: new Date().toISOString() });
});

app.use("/api/recipes", recipesRouter);
app.use("/api/tags", tagsRouter);
app.use("/api/auth", authRouter);
app.use("/api/uploads", uploadsRouter);

// Server-rendered <head> for /recipe/:slug so shared links unfurl with the
// recipe's photo + title. vercel.json rewrites that path to this function;
// real browsers still hydrate the SPA after this initial HTML.
app.use(ogRouter);

// 404 for unknown API routes.
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Not found." });
});

// Central error handler — keeps the response shape consistent.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(err);
    res.status(500).json({ error: "Unexpected server error." });
  },
);

export default app;
