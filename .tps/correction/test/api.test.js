import test, { before, after } from "node:test";
import assert from "node:assert/strict";

// Secret de test AVANT tout import qui lit process.env.JWT_SECRET.
process.env.JWT_SECRET = "secret-de-test";

const { creerApp } = await import("../src/app.js");

let server;
let base;

before(async () => {
  // Port 0 = port libre attribue par l'OS, evite les collisions en CI.
  server = creerApp().listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  base = `http://127.0.0.1:${port}`;
});

after(() => {
  server.close();
});

async function login() {
  const res = await fetch(`${base}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login: "demo", password: "demo" }),
  });
  const body = await res.json();
  return { res, body };
}

test("POST /tasks sans token renvoie 401", async () => {
  const res = await fetch(`${base}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ titre: "X" }),
  });
  assert.equal(res.status, 401);
});

test("POST /auth/login avec mauvais identifiants renvoie 401", async () => {
  const res = await fetch(`${base}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login: "demo", password: "mauvais" }),
  });
  assert.equal(res.status, 401);
});

test("parcours : login puis creation de tache (201)", async () => {
  const { res: resLogin, body: bodyLogin } = await login();
  assert.equal(resLogin.status, 200);
  assert.ok(typeof bodyLogin.token === "string" && bodyLogin.token.length > 0);

  const res = await fetch(`${base}/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${bodyLogin.token}`,
    },
    body: JSON.stringify({ titre: "Tache test" }),
  });
  assert.equal(res.status, 201);
  const tache = await res.json();
  assert.equal(tache.titre, "Tache test");
  assert.equal(tache.faite, false);
  assert.ok(typeof tache.id === "number");
});

test("body invalide (titre vide) renvoie 400 avec details", async () => {
  const { body } = await login();
  const res = await fetch(`${base}/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${body.token}`,
    },
    body: JSON.stringify({}),
  });
  assert.equal(res.status, 400);
  const json = await res.json();
  assert.equal(json.error, "Donnees invalides");
  assert.ok(Array.isArray(json.details) && json.details.length > 0);
});

test("token invalide renvoie 401", async () => {
  const res = await fetch(`${base}/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer pas-un-vrai-token",
    },
    body: JSON.stringify({ titre: "X" }),
  });
  assert.equal(res.status, 401);
});

test("GET /tasks liste les taches creees", async () => {
  const res = await fetch(`${base}/tasks`);
  assert.equal(res.status, 200);
  const liste = await res.json();
  assert.ok(Array.isArray(liste));
  assert.ok(liste.some((t) => t.titre === "Tache test"));
});

test("GET /tasks/:id inexistant renvoie 404 (middleware d'erreur)", async () => {
  const res = await fetch(`${base}/tasks/99999`);
  assert.equal(res.status, 404);
  const json = await res.json();
  assert.match(json.error, /introuvable/);
});
