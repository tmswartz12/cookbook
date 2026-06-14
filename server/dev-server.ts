// Local-only Express runner. NOT used in production — on Vercel the default
// export from api/index.ts is invoked as a serverless function. This file lets
// `npm run dev` (Vite on 5173) proxy /api to a normal Express server on 3001,
// so you can develop without the Vercel CLI. (Primary path remains `vercel dev`.)
import app from "./index";

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => {
  console.log(`[dev] API listening on http://localhost:${port}/api`);
});
