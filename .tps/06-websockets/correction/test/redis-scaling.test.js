import { test } from "node:test";
import assert from "node:assert/strict";
import { io as Client } from "socket.io-client";
import { createServer, createRedisAdapterFactory } from "../src/app.js";

const REDIS_URL = process.env.REDIS_URL;

/**
 * Demarre une instance Socket.IO branchee sur l'adaptateur Redis fourni.
 * Chaque instance a son propre serveur HTTP sur un port libre, mais partage
 * le meme bus Redis Pub/Sub via l'adaptateur.
 */
async function startInstance(factory) {
  const { httpServer, io } = await createServer({ attachAdapter: factory.attach });
  await new Promise((res) => httpServer.listen(0, res));
  const { port } = httpServer.address();
  return {
    url: `http://localhost:${port}`,
    close: () =>
      new Promise((res) => {
        io.close();
        httpServer.close(() => res());
      }),
  };
}

function connectChat(url, token) {
  return new Promise((resolve, reject) => {
    const c = Client(`${url}/chat`, {
      transports: ["websocket"],
      forceNew: true,
      auth: { token },
    });
    c.on("connect", () => resolve(c));
    c.on("connect_error", reject);
  });
}

function emitWithAck(client, event, payload) {
  return new Promise((resolve) => client.emit(event, payload, resolve));
}

test(
  "SCALING Redis : un message emis sur l'instance 2 atteint un client de l'instance 1",
  { skip: REDIS_URL ? false : "REDIS_URL non defini (test scaling ignore)" },
  async () => {
    // Deux factories Redis distinctes = deux paires pub/sub, comme deux process.
    const factory1 = createRedisAdapterFactory(REDIS_URL);
    const factory2 = createRedisAdapterFactory(REDIS_URL);

    const inst1 = await startInstance(factory1);
    const inst2 = await startInstance(factory2);

    // Client A connecte a l'instance 1, Client B a l'instance 2.
    const clientA = await connectChat(inst1.url, "token-alice");
    const clientB = await connectChat(inst2.url, "token-bob");

    // Les deux rejoignent la MEME room (logique, partagee via Redis).
    await emitWithAck(clientA, "room:join", { room: "scale" });
    await emitWithAck(clientB, "room:join", { room: "scale" });

    // Laisse l'adaptateur Redis propager les abonnements de rooms.
    await new Promise((r) => setTimeout(r, 300));

    // clientA (instance 1) doit recevoir un message emis depuis l'instance 2.
    const aReceives = new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error("timeout : message inter-instances non recu")),
        4000
      );
      clientA.once("chat:message", (msg) => {
        clearTimeout(timer);
        resolve(msg);
      });
    });

    await emitWithAck(clientB, "chat:send", {
      room: "scale",
      text: "hello cross-instance",
    });

    const msg = await aReceives;
    assert.equal(msg.text, "hello cross-instance");
    assert.equal(msg.from, "bob");
    assert.equal(msg.room, "scale");

    clientA.disconnect();
    clientB.disconnect();
    await inst1.close();
    await inst2.close();
    await factory1.close();
    await factory2.close();
  }
);
