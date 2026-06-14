/**
 * DIEPS Intent Engine — Server Entry Point
 * 
 * Express server integrating:
 * - Modular API routes (backend/src/api/routes.ts)
 * - Middleware: rate limiting, request logging, error handling
 * - Vite dev server for frontend SPA
 * - WebSocket-ready structure
 * 
 * All API logic has been moved to backend/src/
 * This file only handles server bootstrapping and Vite middleware.
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

// Backend modules
import { apiRouter } from "./backend/src/api/routes.js";
import { rateLimiter, requestLogger, errorHandler } from "./backend/src/api/middleware.js";
import { logger } from "./backend/src/utils/logger.js";
import { SERVER_PORT, NODE_ENV } from "./backend/src/config/index.js";

async function startServer() {
  const app = express();

  // ─── Core Middleware ─────────────────────────────────────────
  app.use(express.json({ limit: '1mb' }));

  // Request logging (before routes)
  app.use('/api', requestLogger);

  // Rate limiting (API routes only)
  app.use('/api', rateLimiter);

  // ─── API Routes ──────────────────────────────────────────────
  app.use('/api', apiRouter);

  // ─── Error Handler ───────────────────────────────────────────
  app.use(errorHandler);

  // ─── Frontend (Vite SPA) ─────────────────────────────────────
  if (NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // ─── Start Server ────────────────────────────────────────────
  app.listen(SERVER_PORT, "0.0.0.0", () => {
    logger.info(`🚀 DIEPS Intent Engine running on http://localhost:${SERVER_PORT}`, {
      env: NODE_ENV,
      network: 'Sui Mainnet',
    });
    logger.info('API endpoints:', {
      endpoints: [
        'POST /api/parse-intent',
        'POST /api/calculate-optimal-route',
        'POST /api/evaluate-guardian-risk',
        'POST /api/balance',
        'POST /api/sui-rpc',
        'POST /api/execute-swap',
      ],
    });
  });
}

startServer().catch((err) => {
  logger.error('Failed to start server', { error: err.message, stack: err.stack });
  process.exit(1);
});
