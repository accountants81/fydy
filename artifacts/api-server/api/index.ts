// Vercel serverless entrypoint. Vercel auto-detects files under /api as
// individual serverless functions. An Express app instance is itself a
// valid (req, res) request handler, so we can export it directly instead
// of calling app.listen() (which is only for the persistent-server model
// used by `pnpm dev`/`pnpm start` locally and on Replit).
import app from "../src/app";

export default app;
