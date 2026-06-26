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

test("GET /products/1 -> 200", async () => {
  const res = await fetch(`${base}/products/1`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { id: 1, name: "Clavier" });
});

test("GET /products/abc -> 400", async () => {
  const res = await fetch(`${base}/products/abc`);
  assert.equal(res.status, 400);
  assert.match((await res.json()).error, /id invalide/);
});

test("GET /products/999 -> 404", async () => {
  const res = await fetch(`${base}/products/999`);
  assert.equal(res.status, 404);
  assert.match((await res.json()).error, /introuvable/);
});

test("GET /products/report -> 200 (route lente, iterations reduites)", async () => {
  const res = await fetch(`${base}/products/report?iterations=10000`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.total, 2);
  assert.equal(typeof body.checksum, "number");
});
