# Cookbook 🥘

A shared, lived-in kitchen journal for **Tyler & Sarah** — a growing database of recipes
they cook over the years, each with a photo. **Anyone with the link can browse**; only the
two of them (Google sign-in + email allowlist) can add or edit.

- **Viewers**: no account, no login. The whole site is readable by link.
- **Editors**: sign in with Google; only emails in `EDITOR_EMAILS` can create/edit/delete.
  Every write is enforced server-side — the UI just hides the controls.

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | Vite + React 18 + TypeScript + React Router + TanStack Query + Tailwind |
| Backend | Node + Express + TypeScript (Mongoose) |
| Database | MongoDB (Atlas in prod) |
| Images | Cloudinary (signed browser uploads + delivery transforms) |
| Auth | Google Identity Services → app JWT in an httpOnly cookie |
| Hosting | Vercel — SPA static build + Express as a serverless function under `/api` |

## Project layout

```
api/                Express app (serverless entry: api/index.ts → `export default app`)
  routes/           recipes, auth, uploads
  lib/              db (cached connection), auth (jwt + requireEditor), cloudinary, validation, slug
  models/Recipe.ts  Mongoose schema (slug + text + dateCooked indexes)
  seed.ts           sample data (run with `npm run seed`)
  dev-server.ts     local-only Express runner for `npm run dev:api`
src/                React SPA (pages, components, api client + hooks)
shared/types.ts     types imported by both sides
vercel.json         build + function + rewrite config
```

## Local development

Requirements: Node 20+, a MongoDB you can write to (local `mongod` or an Atlas string).

```bash
npm install
cp .env.example .env        # then fill in the values (see below)
npm run seed                # optional: insert 4 sample recipes
npm run dev:all             # Express (:3001) + Vite (:5173) in one terminal
# open http://localhost:5173
```

`npm run dev:all` runs both processes (Vite proxies `/api` → Express). You can also run them
separately with `npm run dev:api` and `npm run dev`, or use `vercel dev` to mirror production.

### Scripts

| Script | What it does |
|---|---|
| `npm run dev:all` | Express + Vite together (recommended for local) |
| `npm run dev` | Vite only (expects the API on :3001) |
| `npm run dev:api` | Local Express runner on :3001 |
| `npm run dev:vercel` | `vercel dev` — SPA + serverless API, matches prod |
| `npm run build` | Typecheck + Vite production build → `dist/` |
| `npm run typecheck` | `tsc -b` across api/src/shared |
| `npm run seed` | Insert sample recipes (idempotent, upserts by slug) |

## Environment variables

Copy `.env.example` → `.env`. **Never commit `.env`** (it's gitignored).

**Backend / serverless**

| Var | Notes |
|---|---|
| `MONGODB_URI` | Mongo connection string (include a db name, e.g. `…/cookbook`) |
| `JWT_SECRET` | Random secret for app JWTs — `openssl rand -hex 32` |
| `GOOGLE_CLIENT_ID` | Google OAuth Web client ID (same value as the VITE one) |
| `EDITOR_EMAILS` | Comma-separated allowlist, e.g. `a@gmail.com,b@gmail.com` |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | From your Cloudinary dashboard |
| `CLIENT_ORIGIN` | Allowed CORS origin (prod: your Vercel URL) |
| `NODE_ENV` | `development` locally; `production` on Vercel (sets the Secure cookie flag) |

**Frontend (public, must be `VITE_`-prefixed)**

| Var | Notes |
|---|---|
| `VITE_GOOGLE_CLIENT_ID` | Same as `GOOGLE_CLIENT_ID` |
| `VITE_CLOUDINARY_CLOUD_NAME` | Same as `CLOUDINARY_CLOUD_NAME` (used to build delivery URLs) |
| `VITE_API_URL` | `/api` (same-origin on Vercel) |

## External service setup

### MongoDB Atlas
1. Create a free **M0** cluster, a DB user, and allowlist `0.0.0.0/0` (or Vercel egress IPs).
2. Use the SRV connection string as `MONGODB_URI` (add `/cookbook` for the db name).

### Cloudinary
1. Create a free account; note **cloud name**, **API key**, **API secret**.
2. Uploads land in the folder `cookbook/recipes`. Delivery uses `f_auto,q_auto` (auto
   format/quality at the CDN edge) — originals are never served.

### Google OAuth
1. Google Cloud Console → **OAuth consent screen** → External (testing is fine; add the
   editors as test users).
2. **Credentials → Create → OAuth client ID → Web application.**
3. Authorized JavaScript origins: `http://localhost:5173` and your Vercel domain.
4. Use the client ID for both `GOOGLE_CLIENT_ID` and `VITE_GOOGLE_CLIENT_ID`.

## Deploy (Vercel)

1. Push this repo to GitHub and import it in Vercel.
2. Vercel uses `vercel.json`: builds the SPA to `dist/`, deploys `api/index.ts` as a
   serverless function, and rewrites `/api/*` → the Express app and everything else → the SPA.
3. Add **all** env vars (Production + Preview) in Vercel project settings. Set
   `NODE_ENV=production` and `CLIENT_ORIGIN` to your Vercel URL.
4. Add the Vercel domain to the Google OAuth authorized origins.

### Fallback: Express on Render/Railway
If serverless cold starts or routing become annoying, host the Express API on Render or
Railway as a normal long-running server and keep the frontend on Vercel. Changes needed:
- Set `VITE_API_URL` to the API's full URL.
- Set `CLIENT_ORIGIN` to the Vercel domain (for CORS).
- Cross-site cookies then need `SameSite=None; Secure` (adjust `setSessionCookie` in
  `api/lib/auth.ts`), or switch to token-in-header auth.

## How it works (the important bits)

- **Serverless-safe Mongo** (`api/lib/db.ts`): the connection is cached on `global` so cold
  starts don't open a new connection every invocation.
- **Auth** (`api/lib/auth.ts`): Google credential verified server-side → app JWT (`{email, role}`)
  in an httpOnly cookie. `requireEditor` guards all writes (`401` unauthenticated, `403`
  signed-in-but-not-editor).
- **Images** (`api/lib/cloudinary.ts` + `src/api/upload.ts`): the browser downscales to
  ≤2000px, gets a signed payload from `/api/uploads/sign`, then uploads **directly** to
  Cloudinary. Deleting a recipe also deletes its Cloudinary assets.
- **Data flow**: components never call HTTP directly — everything goes through the axios
  instance + TanStack Query hooks in `src/api/client.ts`.
