import express from "express";
import productsRouter from "./routes/products.js";
import { errorHandler } from "./middleware/errorHandler.js";

export function createApp() {
  const app = express();
  app.use("/products", productsRouter);
  app.use(errorHandler); // apres les routes
  return app;
}
