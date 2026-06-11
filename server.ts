import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

import { initializeGraph } from "./src/services/graph";
import apiRoutes from "./src/routes/api.routes";


async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize the Static Graph for deep liquidity paths
  await initializeGraph('pool_related_ids.txt');

  // Mount all API routes
  app.use("/api", apiRoutes);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
