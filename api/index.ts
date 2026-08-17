/**
 * Vercel serverless function entry point. Every request under /api/* is
 * rewritten here (see vercel.json) with the original path intact, so the
 * existing Express app — which already mounts all routes under /api — just
 * works unchanged. This file exists only for Vercel; local development still
 * uses server/src/index.ts, which calls app.listen() directly.
 *
 * Imports the COMPILED server (server/dist, produced by the "vercel-build"
 * script below) rather than the TypeScript source. This sidesteps any
 * uncertainty about whether Vercel's on-the-fly bundler correctly resolves
 * this project's NodeNext-style ".js"-importing-a-".ts"-file pattern — the
 * server is already known to compile correctly (verified locally), so the
 * function just imports plain, already-resolved JavaScript.
 */
import { createApp } from "../server/dist/app.js";

const app = createApp();

export default app;