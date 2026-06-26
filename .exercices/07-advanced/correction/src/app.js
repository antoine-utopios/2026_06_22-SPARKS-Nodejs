import express from "express";
import { contextMiddleware, getRequestId, log } from "./context.js";

// Fabrique l'app. logger injectable : permet de capturer les logs en test.
export function createApp(logger) {
  const app = express();
  app.use(contextMiddleware);

  // Couche d'acces aux donnees (profondeur 2), traverse un await.
  async function fetchData() {
    await new Promise((r) => setTimeout(r, Math.random() * 50));
    log("donnees chargees", logger);
    return { value: 42 };
  }

  // Couche service (profondeur 1).
  async function service() {
    log("service demarre", logger);
    const data = await fetchData();
    log("service termine", logger);
    return data;
  }

  app.get("/work", async (req, res) => {
    log("requete recue", logger);
    const data = await service();
    res.json({ requestId: getRequestId(), data });
  });

  return app;
}
