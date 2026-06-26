import { test } from "node:test";
import assert from "node:assert/strict";
import { signPayload, verifyPayload, getPublicKeyPem } from "../src/signer.js";

test("signature valide verifiee a true", () => {
  const payload = JSON.stringify({ input: 10, result: 55 });
  assert.equal(verifyPayload(payload, signPayload(payload)), true);
});

test("donnee alteree -> verification false", () => {
  const payload = JSON.stringify({ input: 10, result: 55 });
  const sig = signPayload(payload);
  const altere = JSON.stringify({ input: 10, result: 56 });
  assert.equal(verifyPayload(altere, sig), false);
});

test("cle publique exportee en PEM", () => {
  assert.match(getPublicKeyPem(), /BEGIN PUBLIC KEY/);
});
