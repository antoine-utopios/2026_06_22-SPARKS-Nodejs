import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import amqp from "amqplib";
import { creerApp } from "../src/api.js";
import { demarrerWorker } from "../src/worker.js";
import {
  configurerTopologie,
  QUEUE,
  DLQ,
  AMQP_URL,
} from "../src/topologie.js";

let conn;
let ch;
let server;
let baseUrl;
const workers = [];

const attendre = (ms) => new Promise((r) => setTimeout(r, ms));

async function poster(corps) {
  const res = await fetch(`${baseUrl}/rapports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(corps),
  });
  return { status: res.status, body: await res.json() };
}

beforeEach(async () => {
  conn = await amqp.connect(AMQP_URL);
  ch = await conn.createChannel();
  await configurerTopologie(ch);
  await ch.purgeQueue(QUEUE);
  await ch.purgeQueue(DLQ);

  const app = creerApp(ch);
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
});

afterEach(async () => {
  while (workers.length) await workers.pop().fermer();
  await new Promise((r) => server.close(r));
  await ch.close().catch(() => {});
  await conn.close().catch(() => {});
});

async function spawnWorker(opts) {
  const w = await demarrerWorker(opts);
  workers.push(w);
  return w;
}

test("POST /rapports renvoie 202 et publie dans la queue (worker non lance)", async () => {
  const { status, body } = await poster({ titre: "Bilan Q1", client: "Utopios" });
  assert.equal(status, 202);
  assert.equal(body.statut, "accepte");
  assert.ok(body.id);
  assert.equal(body.bufferOk, true);

  await attendre(150);
  const stats = await ch.checkQueue(QUEUE);
  assert.equal(stats.messageCount, 1, "1 message Ready, en attente d'un worker");
});

test("flux complet : API publie, worker consomme et ack", async () => {
  const traites = [];
  await spawnWorker({ prefetch: 2, delai: 20, onTraite: (e) => traites.push(e) });

  const { body } = await poster({ titre: "Rapport OK" });
  await attendre(300);

  assert.equal(traites.length, 1);
  assert.equal(traites[0].etat, "ack");
  assert.equal(traites[0].tache.id, body.id);
  const stats = await ch.checkQueue(QUEUE);
  assert.equal(stats.messageCount, 0, "queue vide apres ack");
});

test("erreur definitive : message route vers la DLQ", async () => {
  const traites = [];
  await spawnWorker({ prefetch: 2, delai: 20, onTraite: (e) => traites.push(e) });

  await poster({ titre: "KO_DEFINITIF" });
  await attendre(400);

  assert.equal(traites.at(-1).etat, "dlq");
  const dlq = await ch.checkQueue(DLQ);
  assert.equal(dlq.messageCount, 1, "1 message dans la DLQ");
});

test("erreur transitoire : requeue borne puis DLQ", async () => {
  const traites = [];
  await spawnWorker({ prefetch: 2, delai: 20, onTraite: (e) => traites.push(e) });

  await poster({ titre: "KO_RETRY" });
  await attendre(1500);

  assert.ok(
    traites.filter((e) => e.etat === "requeue").length >= 1,
    "au moins un requeue transitoire"
  );
  assert.equal(traites.filter((e) => e.etat === "dlq").length, 1);
  const dlq = await ch.checkQueue(DLQ);
  assert.equal(dlq.messageCount, 1);
});

test("back-pressure : prefetch borne les messages non acquittes en vol", async () => {
  const PREFETCH = 2;
  let relacher;
  const blocage = new Promise((r) => (relacher = r));
  const recus = [];

  const consConn = await amqp.connect(AMQP_URL);
  const consCh = await consConn.createChannel();
  await consCh.prefetch(PREFETCH);
  await consCh.consume(QUEUE, async (msg) => {
    if (!msg) return;
    recus.push(msg);
    await blocage;
    consCh.ack(msg);
  });

  for (let i = 0; i < 5; i++) await poster({ titre: `R${i}` });
  await attendre(600);

  assert.equal(recus.length, PREFETCH, `prefetch limite a ${PREFETCH} en vol`);
  const stats = await consCh.checkQueue(QUEUE);
  assert.equal(stats.messageCount, 3, "3 messages restent Ready");

  relacher();
  await attendre(300);
  await consCh.close();
  await consConn.close();
});
