import express from "express";
import { getArticle } from "./articleService.js";
import { errorHandler } from "./errorHandler.js";

// Express 4 : les rejets async ne partent PAS automatiquement vers le
// middleware d'erreur. On enveloppe le handler pour les propager via next().
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export function createApp() {
  const app = express();

  app.get(
    "/articles/:id",
    asyncHandler(async (req, res) => {
      const article = await getArticle(req.params.id);
      res.json(article);
    })
  );

  // Route demontrant une erreur programmeur (non operationnelle) -> 500 generique.
  app.get("/boom", () => {
    throw new Error("bug non operationnel");
  });

  // Middleware centralise enregistre EN DERNIER.
  app.use(errorHandler);

  return app;
}
