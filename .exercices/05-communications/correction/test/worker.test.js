import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import amqp from "amqplib";
import { demarrerWorker, nbTentatives } from "../src/worker.js";
import {
  configurerTopologie,
  EXCHANGE,
  QUEUE,
  DLQ,
  ROUTING_KEY,
  AMQP_URL,
} from "../src/topologie.js";

let conn;
let ch;
const workers = [];

function attendre(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// Purge les queues + recree la topologie avant chaque test pour repartir propre.
beforeEach(async () => {
  conn = await amqp.connect(AMQP_URL);
  ch = await conn.createChannel();
  await configurerTopologie(ch);
  await ch.purgeQueue(QUEUE);
  await ch.purgeQueue(DLQ);
});

afterEach(async () => {
  while (workers.length) {
    const w = workers.pop();
    await w.fermer();
  }
  await ch.close().catch(() => {});
  await conn.close().catch(() => {});
});

function publier(commande) {
  return ch.publish(
    EXCHANGE,
    ROUTING_KEY,
    Buffer.from(JSON.stringify(commande)),
    { persistent: true, contentType: "application/json" }
  );
}

async function spawnWorker(opts) {
  const w = await demarrerWorker(opts);
  workers.push(w);
  return w;
}

test("ack : un message traite avec succes est retire de la queue", async () => {
  const traites = [];
  await spawnWorker({ prefetch: 1, onTraite: (e) => traites.push(e) });

  publier({ id: "ok-1" });
  await attendre(300);

  assert.equal(traites.length, 1);
  assert.equal(traites[0].etat, "ack");
  const stats = await ch.checkQueue(QUEUE);
  assert.equal(stats.messageCount, 0, "la queue doit etre vide apres ack");
});

test("nack(false,false) : une erreur definitive route le message vers la DLQ", async () => {
  const traites = [];
  await spawnWorker({ prefetch: 1, onTraite: (e) => traites.push(e) });

  publier({ id: "ko-def", erreur: "definitive" });
  await attendre(400);

  assert.equal(traites.at(-1).etat, "dlq");
  const principal = await ch.checkQueue(QUEUE);
  const dlq = await ch.checkQueue(DLQ);
  assert.equal(principal.messageCount, 0, "queue principale vide");
  assert.equal(dlq.messageCount, 1, "1 message dans la DLQ");

  // Le message en DLQ porte bien l'en-tete x-death (trace du dead-lettering).
  const recu = await ch.get(DLQ, { noAck: true });
  assert.ok(recu, "un message doit etre lisible en DLQ");
  assert.equal(JSON.parse(recu.content.toString()).id, "ko-def");
  assert.ok(nbTentatives(recu) >= 1, "x-death doit etre present");
});

test("erreur transitoire : requeue borne puis bascule en DLQ", async () => {
  const traites = [];
  await spawnWorker({ prefetch: 1, onTraite: (e) => traites.push(e) });

  publier({ id: "ko-retry", erreur: "transitoire" });
  await attendre(1500);

  const requeues = traites.filter((e) => e.etat === "requeue");
  const dlq = traites.filter((e) => e.etat === "dlq");
  assert.ok(requeues.length >= 1, "au moins un requeue transitoire");
  assert.equal(dlq.length, 1, "fini par partir en DLQ");

  const dlqStats = await ch.checkQueue(DLQ);
  assert.equal(dlqStats.messageCount, 1);
});

test("prefetch limite le nombre de messages non acquittes en vol", async () => {
  // Worker qui ne renvoie JAMAIS de promesse resolue : on intercepte via un
  // worker dont le callback bloque, pour mesurer combien de messages RabbitMQ
  // accepte de livrer en parallele. On utilise un consumer manuel ici.
  const PREFETCH = 2;
  const recus = [];
  let relacher;
  const blocage = new Promise((r) => {
    relacher = r;
  });

  const consConn = await amqp.connect(AMQP_URL);
  const consCh = await consConn.createChannel();
  await consCh.prefetch(PREFETCH);
  await consCh.consume(QUEUE, async (msg) => {
    if (!msg) return;
    recus.push(msg);
    await blocage; // ne jamais ack tant qu'on n'a pas mesure
    consCh.ack(msg);
  });

  // Publie 5 messages, mais avec prefetch=2 et aucun ack, seuls 2 doivent partir.
  for (let i = 0; i < 5; i++) publier({ id: `p-${i}` });
  await attendre(500);

  assert.equal(
    recus.length,
    PREFETCH,
    `prefetch=${PREFETCH} doit limiter a ${PREFETCH} messages non acquittes en vol`
  );

  const stats = await consCh.checkQueue(QUEUE);
  assert.equal(stats.messageCount, 3, "3 messages restent Ready dans la queue");

  relacher();
  await attendre(300);
  await consCh.close();
  await consConn.close();
});
