import { test } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";

function createSpyLogger() {
  const entries = [];
  return { entries, log: (entry) => entries.push(entry) };
}

function startServer(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, () => resolve({ server, port: server.address().port }));
  });
}

test("trois requetes concurrentes : requestId distincts, aucune fuite de contexte", async () => {
  const spy = createSpyLogger();
  const { server, port } = await startServer(createApp(spy));

  try {
    const base = `http://127.0.0.1:${port}/work`;
    const ids = ["A", "B", "C"];
    const results = await Promise.all(
      ids.map((id) =>
        fetch(base, { headers: { "x-request-id": id } }).then((r) => r.json()),
      ),
    );

    // Chaque reponse porte son propre requestId.
    assert.deepEqual(results.map((r) => r.requestId).sort(), ids);

    // Chaque requete a emis exactement ses 4 lignes, toutes correlees.
    const expected = ["requete recue", "service demarre", "donnees chargees", "service termine"];
    for (const id of ids) {
      const logs = spy.entries.filter((e) => e.requestId === id);
      assert.equal(logs.length, expected.length, `${id} doit avoir ${expected.length} logs`);
      for (const m of expected) {
        assert.ok(logs.some((e) => e.message === m), `${id} doit logger: ${m}`);
      }
    }

    // Aucun log sans contexte (next appele hors run() le provoquerait).
    assert.equal(spy.entries.filter((e) => e.requestId === undefined).length, 0);
  } finally {
    server.close();
  }
});

test("UUID genere en l'absence d'en-tete x-request-id", async () => {
  const spy = createSpyLogger();
  const { server, port } = await startServer(createApp(spy));
  try {
    const res = await fetch(`http://127.0.0.1:${port}/work`).then((r) => r.json());
    assert.match(
      res.requestId,
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  } finally {
    server.close();
  }
});

test("getStore() robuste hors contexte (chainage optionnel)", async () => {
  const { getRequestId } = await import("../src/context.js");
  // Appel hors de toute requete : ne doit pas crasher, renvoie undefined.
  assert.equal(getRequestId(), undefined);
});
