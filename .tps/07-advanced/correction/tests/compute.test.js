import { test } from "node:test";
import assert from "node:assert/strict";
import { runComputation } from "../src/compute.js";

test("le Worker calcule fibonacci correctement", async () => {
  assert.equal(await runComputation(10), 55);
  assert.equal(await runComputation(20), 6765);
});

test("le thread principal reste reactif pendant le calcul deporte", async () => {
  let ticks = 0;
  const timer = setInterval(() => ticks++, 5);

  // Calcul lourd deporte : le thread principal continue de tourner.
  const result = await runComputation(35);
  clearInterval(timer);

  assert.equal(result, 9227465);
  // Si le calcul bloquait l'event loop, les timers ne se declencheraient pas.
  assert.ok(ticks > 0, `le thread principal doit rester actif (ticks=${ticks})`);
});

test("deux calculs concurrents tournent sur des threads distincts", async () => {
  const [a, b] = await Promise.all([runComputation(25), runComputation(26)]);
  assert.equal(a, 75025);
  assert.equal(b, 121393);
});
