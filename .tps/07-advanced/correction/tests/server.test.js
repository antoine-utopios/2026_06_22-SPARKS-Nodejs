import { test } from "node:test";
import assert from "node:assert/strict";
import { createApp, buildCanonicalPayload } from "../src/app.js";
import { verifyPayload } from "../src/signer.js";

function startServer(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, () => resolve({ server, port: server.address().port }));
  });
}

test("/compute : calcul deporte, reponse en flux, signature verifiable de bout en bout", async () => {
  const { server, port } = await startServer(createApp());
  try {
    const res = await fetch(`http://127.0.0.1:${port}/compute?input=20`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get("content-type"), /application\/json/);

    const body = await res.json();
    assert.equal(body.input, 20);
    assert.equal(body.result, 6765);

    // La signature recue valide la chaine canonique (input,result).
    const payload = buildCanonicalPayload(body.input, body.result);
    assert.equal(verifyPayload(payload, body.signature), true);
    assert.match(body.publicKey, /BEGIN PUBLIC KEY/);
  } finally {
    server.close();
  }
});

test("/compute : input invalide -> 400", async () => {
  const { server, port } = await startServer(createApp());
  try {
    for (const q of ["abc", "-1", "100", "3.5"]) {
      const res = await fetch(`http://127.0.0.1:${port}/compute?input=${q}`);
      assert.equal(res.status, 400, `input=${q} doit renvoyer 400`);
    }
  } finally {
    server.close();
  }
});

test("/public-key : renvoie la cle publique PEM", async () => {
  const { server, port } = await startServer(createApp());
  try {
    const res = await fetch(`http://127.0.0.1:${port}/public-key`);
    assert.equal(res.status, 200);
    assert.match(await res.text(), /BEGIN PUBLIC KEY/);
  } finally {
    server.close();
  }
});
