import { test } from "node:test";
import assert from "node:assert/strict";
import { io as Client } from "socket.io-client";
import { createServer } from "../src/app.js";

async function startServer() {
  const { httpServer, io } = await createServer();
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

/** Connecte un client au namespace /chat avec un token donne (peut etre invalide). */
function connectChat(url, token) {
  return new Promise((resolve, reject) => {
    const c = Client(`${url}/chat`, {
      transports: ["websocket"],
      forceNew: true,
      auth: token === undefined ? {} : { token },
    });
    c.on("connect", () => resolve(c));
    c.on("connect_error", (err) => reject(err));
  });
}

function emitWithAck(client, event, payload) {
  return new Promise((resolve) => client.emit(event, payload, resolve));
}

test("AUTH : connexion REFUSEE sans token", async () => {
  const server = await startServer();
  await assert.rejects(
    () => connectChat(server.url, undefined),
    (err) => {
      assert.equal(err.message, "unauthorized");
      return true;
    }
  );
  await server.close();
});

test("AUTH : connexion REFUSEE avec token invalide", async () => {
  const server = await startServer();
  await assert.rejects(
    () => connectChat(server.url, "token-bidon"),
    (err) => err.message === "unauthorized"
  );
  await server.close();
});

test("AUTH : connexion ACCEPTEE avec token valide", async () => {
  const server = await startServer();
  const c = await connectChat(server.url, "token-alice");
  assert.equal(c.connected, true);
  c.disconnect();
  await server.close();
});

test("NAMESPACE + ROOMS + events types : diffusion ciblee a la room", async () => {
  const server = await startServer();
  const alice = await connectChat(server.url, "token-alice");
  const bob = await connectChat(server.url, "token-bob");
  const carol = await connectChat(server.url, "token-test"); // hors room

  const joinAck = await emitWithAck(alice, "room:join", { room: "general" });
  assert.equal(joinAck.ok, true);
  assert.equal(joinAck.room, "general");
  await emitWithAck(bob, "room:join", { room: "general" });

  let carolReceived = false;
  carol.on("chat:message", () => (carolReceived = true));
  const bobReceives = new Promise((r) => bob.once("chat:message", r));

  const sendAck = await emitWithAck(alice, "chat:send", {
    room: "general",
    text: "hello general",
  });
  assert.equal(sendAck.ok, true);
  assert.equal(sendAck.delivered, true);

  const msg = await bobReceives;
  assert.equal(msg.text, "hello general");
  assert.equal(msg.from, "alice"); // event type : `from` = nom de l'utilisateur authentifie
  assert.equal(msg.room, "general");

  await new Promise((r) => setTimeout(r, 150));
  assert.equal(carolReceived, false, "Carol (hors room) ne recoit pas");

  alice.disconnect();
  bob.disconnect();
  carol.disconnect();
  await server.close();
});
