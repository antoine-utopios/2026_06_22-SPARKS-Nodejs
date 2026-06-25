import { describe, it } from "node:test";
import assert from "node:assert/strict";
import sinon from "sinon";
import request from "supertest";
import { createApp } from "../src/app.js";
import { TaskService } from "../src/task-service.js";

describe("Routes /tasks", () => {
  it("POST /tasks crée une tâche (201) avec API externe stubbée", async () => {
    const weatherApi = { forecast: sinon.stub().resolves({ temp: 30 }) };
    const app = createApp(new TaskService(weatherApi));

    const res = await request(app)
      .post("/tasks")
      .send({ title: "Réviser", city: "Nice" });

    assert.equal(res.status, 201);
    assert.equal(res.body.temp, 30);
    assert.ok(weatherApi.forecast.calledOnceWith("Nice"));
  });

  it("POST /tasks sans titre renvoie 400", async () => {
    const app = createApp(new TaskService({ forecast: sinon.stub() }));
    const res = await request(app).post("/tasks").send({});
    assert.equal(res.status, 400);
    assert.equal(res.body.error, "TITLE_REQUIRED");
  });

  it("GET /tasks renvoie la liste", async () => {
    const app = createApp(new TaskService({ forecast: sinon.stub().resolves({ temp: 5 }) }));
    await request(app).post("/tasks").send({ title: "A", city: "Z" });
    const res = await request(app).get("/tasks");
    assert.equal(res.status, 200);
    assert.equal(res.body.length, 1);
  });
});
