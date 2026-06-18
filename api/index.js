var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server/index.ts
var index_exports = {};
__export(index_exports, {
  default: () => index_default
});
module.exports = __toCommonJS(index_exports);
var import_express4 = __toESM(require("express"), 1);
var import_cors = __toESM(require("cors"), 1);
var import_helmet = __toESM(require("helmet"), 1);
var import_cookie_parser = __toESM(require("cookie-parser"), 1);

// server/lib/db.ts
var import_mongoose = __toESM(require("mongoose"), 1);
var globalForMongoose = global;
var cached = globalForMongoose._mongoose ?? (globalForMongoose._mongoose = { conn: null, promise: null });
async function connectDB() {
  if (cached.conn) return cached.conn;
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set. Add it to your environment / .env file.");
  }
  if (!cached.promise) {
    cached.promise = import_mongoose.default.connect(uri, { bufferCommands: false });
  }
  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }
  return cached.conn;
}

// server/routes/recipes.ts
var import_express = require("express");

// server/models/Recipe.ts
var import_mongoose2 = __toESM(require("mongoose"), 1);

// server/lib/slug.ts
function slugify(input) {
  return input.normalize("NFKD").replace(new RegExp("\\p{Diacritic}", "gu"), "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}
function randomSuffix() {
  return Math.random().toString(36).slice(2, 6);
}
function normalizeTags(tags) {
  if (!tags) return [];
  const seen = /* @__PURE__ */ new Set();
  const out = [];
  for (const raw of tags) {
    const t = raw.trim().toLowerCase();
    if (t && !seen.has(t)) {
      seen.add(t);
      out.push(t);
    }
  }
  return out;
}

// server/models/Recipe.ts
var { Schema, model, models } = import_mongoose2.default;
var cloudImageSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true }
  },
  { _id: false }
);
var recipeSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, trim: true },
    dateCooked: { type: Date, required: true },
    heroImage: { type: cloudImageSchema, default: void 0 },
    gallery: { type: [cloudImageSchema], default: [] },
    ingredients: { type: [String], default: [] },
    steps: { type: [String], default: [] },
    tags: { type: [String], default: [], index: true },
    cuisine: { type: String, trim: true },
    prepMinutes: { type: Number, min: 0 },
    cookMinutes: { type: Number, min: 0 },
    servings: { type: Number, min: 0 },
    rating: { type: Number, min: 1, max: 5 },
    makeAgain: { type: Boolean, default: false },
    notes: { type: String },
    sourceUrl: { type: String, trim: true },
    createdBy: { type: String, required: true }
  },
  { timestamps: true }
);
recipeSchema.index({ title: "text", tags: "text", ingredients: "text", description: "text" });
recipeSchema.index({ dateCooked: -1 });
recipeSchema.pre("save", function(next) {
  if (this.isModified("tags")) {
    this.tags = normalizeTags(this.tags);
  }
  next();
});
var Recipe = models.Recipe || model("Recipe", recipeSchema);

// server/lib/serialize.ts
function serializeRecipe(doc) {
  return {
    _id: String(doc._id),
    title: doc.title,
    slug: doc.slug,
    description: doc.description ?? void 0,
    dateCooked: toISO(doc.dateCooked),
    heroImage: doc.heroImage ?? void 0,
    gallery: doc.gallery ?? [],
    ingredients: doc.ingredients ?? [],
    steps: doc.steps ?? [],
    tags: doc.tags ?? [],
    cuisine: doc.cuisine ?? void 0,
    prepMinutes: doc.prepMinutes ?? void 0,
    cookMinutes: doc.cookMinutes ?? void 0,
    servings: doc.servings ?? void 0,
    rating: doc.rating ?? void 0,
    makeAgain: Boolean(doc.makeAgain),
    notes: doc.notes ?? void 0,
    sourceUrl: doc.sourceUrl ?? void 0,
    createdBy: doc.createdBy,
    createdAt: toISO(doc.createdAt),
    updatedAt: toISO(doc.updatedAt)
  };
}
function toISO(value) {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return "";
}

// server/lib/validation.ts
var import_zod = require("zod");
var cloudImage = import_zod.z.object({
  url: import_zod.z.string().url(),
  publicId: import_zod.z.string().min(1),
  width: import_zod.z.number().int().positive(),
  height: import_zod.z.number().int().positive()
}).strict();
var lineArray = import_zod.z.array(import_zod.z.string().trim().min(1, "No empty lines.")).default([]);
var tagArray = import_zod.z.array(import_zod.z.string().trim().min(1)).max(20).default([]);
var base = {
  title: import_zod.z.string().trim().min(1, "Give it a title."),
  description: import_zod.z.string().trim().max(280).optional(),
  dateCooked: import_zod.z.string().refine((s) => !Number.isNaN(Date.parse(s)), "Invalid date."),
  heroImage: cloudImage.optional(),
  gallery: import_zod.z.array(cloudImage).max(12).default([]),
  ingredients: lineArray,
  steps: lineArray,
  tags: tagArray,
  cuisine: import_zod.z.string().trim().max(60).optional(),
  prepMinutes: import_zod.z.number().int().min(0).max(1e5).optional(),
  cookMinutes: import_zod.z.number().int().min(0).max(1e5).optional(),
  servings: import_zod.z.number().int().min(0).max(1e3).optional(),
  rating: import_zod.z.number().int().min(1).max(5).optional(),
  makeAgain: import_zod.z.boolean().default(false),
  notes: import_zod.z.string().trim().max(4e3).optional(),
  sourceUrl: import_zod.z.string().trim().url().optional().or(import_zod.z.literal(""))
};
var createRecipeSchema = import_zod.z.object(base).strict();
var updateRecipeSchema = import_zod.z.object(base).partial().strict();
function zodFields(err) {
  const out = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".") || "_";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

// server/lib/auth.ts
var import_jsonwebtoken = __toESM(require("jsonwebtoken"), 1);
var COOKIE_NAME = "cb_session";
var SEVEN_DAYS = 7 * 24 * 60 * 60;
function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set.");
  return secret;
}
function isEditorEmail(email) {
  const list = (process.env.EDITOR_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  return list.includes(email.trim().toLowerCase());
}
function signSession(claims) {
  return import_jsonwebtoken.default.sign(claims, getSecret(), { expiresIn: SEVEN_DAYS });
}
function setSessionCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    // non-Secure on http://localhost
    sameSite: "lax",
    maxAge: SEVEN_DAYS * 1e3,
    path: "/"
  });
}
function clearSessionCookie(res) {
  res.clearCookie(COOKIE_NAME, { path: "/" });
}
function readSession(req) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return null;
  try {
    const decoded = import_jsonwebtoken.default.verify(token, getSecret());
    return { email: decoded.email, role: decoded.role };
  } catch {
    return null;
  }
}
function requireEditor(req, res, next) {
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
function currentEmail(req) {
  return readSession(req)?.email ?? "editor@cookbook.local";
}

// server/lib/cloudinary.ts
var import_cloudinary = require("cloudinary");
var configured = false;
function ensureConfigured() {
  if (configured) return;
  import_cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
  configured = true;
}
var UPLOAD_FOLDER = "cookbook/recipes";
function signUpload() {
  ensureConfigured();
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary is not configured.");
  }
  const timestamp = Math.round(Date.now() / 1e3);
  const signature = import_cloudinary.v2.utils.api_sign_request(
    { timestamp, folder: UPLOAD_FOLDER },
    apiSecret
  );
  return { signature, timestamp, apiKey, cloudName, folder: UPLOAD_FOLDER };
}
async function destroyImage(publicId) {
  if (!publicId) return;
  ensureConfigured();
  try {
    await import_cloudinary.v2.uploader.destroy(publicId);
  } catch (err) {
    console.warn(`Cloudinary destroy failed for ${publicId}:`, err);
  }
}

// server/routes/recipes.ts
var router = (0, import_express.Router)();
var tagsRouter = (0, import_express.Router)();
var SORTS = ["newest", "oldest", "rating", "title"];
var SORT_SPEC = {
  newest: { dateCooked: -1 },
  oldest: { dateCooked: 1 },
  rating: { rating: -1, dateCooked: -1 },
  title: { title: 1 }
};
function parseListQuery(req) {
  const q = req.query;
  const search = typeof q.search === "string" ? q.search.trim() : "";
  const tag = typeof q.tag === "string" ? q.tag.trim().toLowerCase() : "";
  const sort = SORTS.includes(q.sort) ? q.sort : "newest";
  const page = Math.max(1, Number(q.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(q.limit) || 24));
  return { search, tag, sort, page, limit };
}
router.get("/", async (req, res, next) => {
  try {
    const { search, tag, sort, page, limit } = parseListQuery(req);
    const filter = {};
    if (tag) filter.tags = tag;
    if (search) filter.$text = { $search: search };
    const sortSpec = SORT_SPEC[sort];
    const [docs, total] = await Promise.all([
      Recipe.find(filter).sort(sortSpec).skip((page - 1) * limit).limit(limit).lean(),
      Recipe.countDocuments(filter)
    ]);
    const body = {
      items: docs.map(serializeRecipe),
      page,
      limit,
      total,
      hasMore: page * limit < total
    };
    res.json(body);
  } catch (err) {
    next(err);
  }
});
router.get("/:slug", async (req, res, next) => {
  try {
    const doc = await Recipe.findOne({ slug: req.params.slug }).lean();
    if (!doc) {
      res.status(404).json({ error: "Recipe not found." });
      return;
    }
    res.json(serializeRecipe(doc));
  } catch (err) {
    next(err);
  }
});
tagsRouter.get("/", async (_req, res, next) => {
  try {
    const tags = await Recipe.distinct("tags");
    tags.sort((a, b) => a.localeCompare(b));
    res.json(tags);
  } catch (err) {
    next(err);
  }
});
async function uniqueSlug(title, ignoreId) {
  const baseSlug = slugify(title) || "recipe";
  for (let attempt = 0; attempt < 6; attempt++) {
    const candidate = attempt === 0 ? baseSlug : `${baseSlug}-${randomSuffix()}`;
    const clash = await Recipe.findOne({ slug: candidate }).select("_id").lean();
    if (!clash || String(clash._id) === ignoreId) return candidate;
  }
  return `${baseSlug}-${randomSuffix()}${randomSuffix()}`;
}
function isSlugConflict(err) {
  return err?.code === 11e3 && Boolean(err?.keyPattern?.slug);
}
router.post("/", requireEditor, async (req, res, next) => {
  const parsed = createRecipeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Please check the highlighted fields.", fields: zodFields(parsed.error) });
    return;
  }
  try {
    const data = parsed.data;
    const slug = await uniqueSlug(data.title);
    const doc = await Recipe.create({
      ...data,
      slug,
      tags: normalizeTags(data.tags),
      dateCooked: new Date(data.dateCooked),
      sourceUrl: data.sourceUrl || void 0,
      createdBy: currentEmail(req)
    });
    res.status(201).json(serializeRecipe(doc.toObject()));
  } catch (err) {
    if (isSlugConflict(err)) {
      res.status(409).json({ error: "A recipe with a similar name already exists." });
      return;
    }
    next(err);
  }
});
router.patch("/:id", requireEditor, async (req, res, next) => {
  const parsed = updateRecipeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Please check the highlighted fields.", fields: zodFields(parsed.error) });
    return;
  }
  try {
    const existing = await Recipe.findById(req.params.id);
    if (!existing) {
      res.status(404).json({ error: "Recipe not found." });
      return;
    }
    const data = parsed.data;
    if (data.title && data.title !== existing.title) {
      existing.slug = await uniqueSlug(data.title, String(existing._id));
    }
    for (const [key, value] of Object.entries(data)) {
      if (key === "dateCooked" && typeof value === "string") {
        existing.set("dateCooked", new Date(value));
      } else if (key === "tags" && Array.isArray(value)) {
        existing.set("tags", normalizeTags(value));
      } else if (key === "sourceUrl") {
        existing.set("sourceUrl", value || void 0);
      } else {
        existing.set(key, value);
      }
    }
    await existing.save();
    res.json(serializeRecipe(existing.toObject()));
  } catch (err) {
    if (isSlugConflict(err)) {
      res.status(409).json({ error: "A recipe with a similar name already exists." });
      return;
    }
    next(err);
  }
});
router.delete("/:id", requireEditor, async (req, res, next) => {
  try {
    const doc = await Recipe.findByIdAndDelete(req.params.id).lean();
    if (!doc) {
      res.status(404).json({ error: "Recipe not found." });
      return;
    }
    const images = [doc.heroImage, ...doc.gallery ?? []].filter(Boolean);
    await Promise.all(images.map((img) => destroyImage(img.publicId)));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
var recipes_default = router;

// server/routes/auth.ts
var import_express2 = require("express");
var import_express_rate_limit = __toESM(require("express-rate-limit"), 1);
var import_google_auth_library = require("google-auth-library");
var router2 = (0, import_express2.Router)();
function getClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error("GOOGLE_CLIENT_ID is not set.");
  return new import_google_auth_library.OAuth2Client(clientId);
}
var loginLimiter = (0, import_express_rate_limit.default)({
  windowMs: 15 * 60 * 1e3,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false
});
router2.post("/google", loginLimiter, async (req, res, next) => {
  try {
    const credential = req.body?.credential;
    if (typeof credential !== "string" || !credential) {
      res.status(400).json({ error: "Missing Google credential." });
      return;
    }
    const client = getClient();
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    const email = payload?.email;
    if (!email || !payload?.email_verified) {
      res.status(401).json({ error: "Could not verify your Google account." });
      return;
    }
    const role = isEditorEmail(email) ? "editor" : "viewer";
    const token = signSession({ email, role });
    setSessionCookie(res, token);
    res.json({ email, role });
  } catch (err) {
    if (err instanceof Error && /token|audience|verify/i.test(err.message)) {
      res.status(401).json({ error: "Sign-in failed. Please try again." });
      return;
    }
    next(err);
  }
});
router2.get("/me", (req, res) => {
  res.json(readSession(req));
});
router2.post("/logout", (_req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});
var auth_default = router2;

// server/routes/uploads.ts
var import_express3 = require("express");
var router3 = (0, import_express3.Router)();
router3.post("/sign", requireEditor, (_req, res, next) => {
  try {
    res.json(signUpload());
  } catch (err) {
    next(err);
  }
});
var uploads_default = router3;

// server/index.ts
var app = (0, import_express4.default)();
var CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";
app.use((0, import_helmet.default)());
app.use(
  (0, import_cors.default)({
    origin: CLIENT_ORIGIN,
    credentials: true
  })
);
app.use(import_express4.default.json({ limit: "1mb" }));
app.use((0, import_cookie_parser.default)());
var DB_EXEMPT = ["/api/health", "/api/auth"];
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
  res.json({ ok: true, db, time: (/* @__PURE__ */ new Date()).toISOString() });
});
app.use("/api/recipes", recipes_default);
app.use("/api/tags", tagsRouter);
app.use("/api/auth", auth_default);
app.use("/api/uploads", uploads_default);
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Not found." });
});
app.use(
  (err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: "Unexpected server error." });
  }
);
var index_default = app;
if (module.exports && module.exports.default) { const d = module.exports.default; module.exports = d; module.exports.default = d; }
