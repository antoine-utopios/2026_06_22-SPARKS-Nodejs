import express from "express";
import tasksRoutes from "./routes/tasks.routes.js";
import authRoutes from "./routes/auth.routes.js";
import { gestionErreurs } from "./middlewares/erreurs.js";

export function creerApp() {
  const app = express();
  app.use(express.json());

  app.use("/auth", authRoutes);
  app.use("/tasks", tasksRoutes);

  app.use(gestionErreurs); // toujours en dernier
  return app;
}
