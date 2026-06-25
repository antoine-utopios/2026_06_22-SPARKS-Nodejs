import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import sinon from "sinon";
import { TaskService } from "../src/task-service.js";

describe("TaskService", () => {
  afterEach(() => sinon.restore());

  it("crée une tâche enrichie de la météo (async, stub)", async () => {
    const weatherApi = { forecast: sinon.stub().resolves({ temp: 12 }) };
    const service = new TaskService(weatherApi);

    const task = await service.create({ title: "Acheter", city: "Lyon" });

    assert.equal(task.temp, 12);
    assert.equal(task.title, "Acheter");
    assert.ok(weatherApi.forecast.calledOnceWith("Lyon"));
  });

  it("rejette une tâche sans titre", async () => {
    const weatherApi = { forecast: sinon.stub() };
    const service = new TaskService(weatherApi);
    await assert.rejects(() => service.create({}), /TITLE_REQUIRED/);
    assert.equal(weatherApi.forecast.callCount, 0);
  });
});
