import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculerRemise } from '../src/remise.js';
import { createApp } from '../src/app.js';

const PETIT = 5000;

test('calculerRemise est deterministe et renvoie 16 caracteres hex', () => {
  const a = calculerRemise('1000', PETIT);
  const b = calculerRemise('1000', PETIT);
  assert.equal(a, b);
  assert.match(a, /^[0-9a-f]{16}$/);
});

test('la route /remise renvoie signature + pid', async () => {
  const app = createApp({ iterations: PETIT });
  const server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  const { port } = server.address();
  const corps = await (await fetch(`http://127.0.0.1:${port}/remise/1000`)).json();
  await new Promise((r) => server.close(r));
  assert.equal(corps.signature, calculerRemise('1000', PETIT));
  assert.equal(corps.pid, process.pid);
});
