import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";

let server;
let base;

before(async () => {
  const app = createApp();
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      base = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
});

after(() => {
  server.close();
});

test("GET /articles/1 -> 200 + article", async () => {
  const res = await fetch(`${base}/articles/1`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { id: 1, title: "Node" });
});

test("GET /articles/abc -> 400 ValidationError (message clair)", async () => {
  const res = await fetch(`${base}/articles/abc`);
  assert.equal(res.status, 400);
  assert.match((await res.json()).error, /id invalide/);
});

test("GET /articles/999 -> 404 NotFoundError (message clair)", async () => {
  const res = await fetch(`${base}/articles/999`);
  assert.equal(res.status, 404);
  assert.match((await res.json()).error, /introuvable/);
});

test("GET /boom -> 500 message generique (detail masque)", async () => {
  const res = await fetch(`${base}/boom`);
  assert.equal(res.status, 500);
  assert.equal((await res.json()).error, "Erreur interne");
});
