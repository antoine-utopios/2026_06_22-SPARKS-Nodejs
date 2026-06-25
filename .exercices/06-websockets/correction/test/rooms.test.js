import { test } from "node:test";
import assert from "node:assert/strict";
import { io as Client } from "socket.io-client";
import { createServer } from "../src/app.js";

function startServer() {
  return new Promise((resolve) => {
    const { httpServer, io } = createServer();
    httpServer.listen(0, () => {
      const { port } = httpServer.address();
      resolve({
        url: `http://localhost:${port}`,
        close: () =>
          new Promise((res) => {
            io.close();
            httpServer.close(() => res());
          }),
      });
    });
  });
}

function connectClient(url) {
  return new Promise((resolve, reject) => {
    const c = Client(url, { transports: ["websocket"], forceNew: true });
    c.on("connect", () => resolve(c));
    c.on("connect_error", reject);
  });
}

/** emit avec ACK promisifie. */
function emitWithAck(client, event, ...args) {
  return new Promise((resolve) => client.emit(event, ...args, resolve));
}

test("join + acknowledgement : le serveur confirme l'entree dans la room", async () => {
  const server = await startServer();
  const alice = await connectClient(server.url);

  const ack = await emitWithAck(alice, "room:join", "A");
  assert.equal(ack.ok, true);
  assert.equal(ack.room, "A");
  assert.equal(ack.members, 1);

  alice.disconnect();
  await server.close();
});

test("diffusion ciblee : membre de A recoit, non-membre NE recoit PAS", async () => {
  const server = await startServer();
  const alice = await connectClient(server.url); // rejoindra A
  const bob = await connectClient(server.url); // rejoindra A
  const carol = await connectClient(server.url); // restera hors de A

  await emitWithAck(alice, "room:join", "A");
  await emitWithAck(bob, "room:join", "A");

  // Carol ne doit RIEN recevoir : on echoue le test si elle recoit un message.
  let carolReceived = false;
  carol.on("room:message", () => {
    carolReceived = true;
  });

  const bobReceives = new Promise((resolve) =>
    bob.once("room:message", resolve)
  );

  const ack = await emitWithAck(alice, "room:message", {
    room: "A",
    text: "secret A",
  });

  // ACK de confirmation a l'emetteur.
  assert.equal(ack.ok, true);
  assert.equal(ack.delivered, true);
  assert.equal(ack.room, "A");

  // Bob (membre de A) recoit le message.
  const msg = await bobReceives;
  assert.equal(msg.text, "secret A");
  assert.equal(msg.room, "A");

  // Laisse le temps a un eventuel message parasite d'arriver chez Carol.
  await new Promise((r) => setTimeout(r, 150));
  assert.equal(carolReceived, false, "Carol (hors room A) ne doit rien recevoir");

  alice.disconnect();
  bob.disconnect();
  carol.disconnect();
  await server.close();
});

test("leave : apres avoir quitte A, on ne recoit plus les messages de A", async () => {
  const server = await startServer();
  const alice = await connectClient(server.url);
  const bob = await connectClient(server.url);

  await emitWithAck(alice, "room:join", "A");
  await emitWithAck(bob, "room:join", "A");
  await emitWithAck(bob, "room:leave", "A");

  let bobReceived = false;
  bob.on("room:message", () => {
    bobReceived = true;
  });

  await emitWithAck(alice, "room:message", { room: "A", text: "encore A" });
  await new Promise((r) => setTimeout(r, 150));
  assert.equal(bobReceived, false, "Bob a quitte A : il ne doit plus recevoir");

  alice.disconnect();
  bob.disconnect();
  await server.close();
});
