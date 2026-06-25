import express from "express";
import { TaskService } from "./task-service.js";
import { WeatherApi } from "./weather-api.js";

export function createApp(taskService = new TaskService(new WeatherApi())) {
  const app = express();
  app.use(express.json());
  app.use(express.static("public"));

  app.get("/tasks", (req, res) => {
    res.json(taskService.list());
  });

  app.post("/tasks", async (req, res) => {
    try {
      const task = await taskService.create(req.body);
      res.status(201).json(task);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  return app;
}
