import { test } from "node:test";
import assert from "node:assert/strict";
import { jsonWebStream, readWebStream } from "../src/stream.js";

test("le ReadableStream Web produit le corps JSON attendu", async () => {
  const body = { input: 10, result: 55 };
  const stream = jsonWebStream(body);
  assert.ok(stream instanceof ReadableStream);
  const text = await readWebStream(stream);
  assert.deepEqual(JSON.parse(text), body);
});
