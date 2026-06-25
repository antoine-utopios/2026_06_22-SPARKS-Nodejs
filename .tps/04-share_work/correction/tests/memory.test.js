import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApp, MAX_ENTREES } from '../src/app.js';
import { createLeakyApp } from '../src/app-leaky.js';

async function appeler(app, faireRequete) {
  const server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  const { port } = server.address();
  await faireRequete(`http://127.0.0.1:${port}`);
  await new Promise((r) => server.close(r));
}

test('version fuyante : cle unique par requete -> le cache croit sans borne', async () => {
  const app = createLeakyApp();
  await appeler(app, async (base) => {
    for (let i = 0; i < 80; i++) await (await fetch(`${base}/produit/42`)).json();
  });
  assert.ok(app.locals.tailleCache() >= 80, `attendu >= 80, obtenu ${app.locals.tailleCache()}`);
});

test('version corrigee : le LRU plafonne la taille meme avec beaucoup d ids distincts', async () => {
  const app = createApp();
  await appeler(app, async (base) => {
    for (let i = 0; i < MAX_ENTREES + 300; i++) await (await fetch(`${base}/produit/${i}`)).json();
  });
  assert.ok(
    app.locals.tailleCache() <= MAX_ENTREES,
    `taille ${app.locals.tailleCache()} doit etre <= ${MAX_ENTREES}`,
  );
});

test('version corrigee : cle stable -> meme id => une seule entree', async () => {
  const app = createApp();
  let dernier;
  await appeler(app, async (base) => {
    for (let i = 0; i < 50; i++) dernier = await (await fetch(`${base}/produit/42`)).json();
  });
  assert.equal(dernier.entrees, 1);
});
