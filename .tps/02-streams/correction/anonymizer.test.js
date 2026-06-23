import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { Anonymizer } from './anonymizer.js';

async function run(input) {
  const a = new Anonymizer();
  const out = [];
  a.on('data', (c) => out.push(c.toString('utf8')));
  await pipeline(Readable.from(input), a);
  return out.join('');
}

test('anonymise les e-mails et passe en majuscules', async () => {
  const input = 'jean dupont <jean@acme.fr>\nmarie curie <marie@lab.org>\n';
  const text = await run([input]);
  assert.equal(text, 'JEAN DUPONT <***@***>\nMARIE CURIE <***@***>\n');
});

test('robuste au decoupage en chunks de quelques octets', async () => {
  const input = 'jean dupont <jean@acme.fr>\nmarie curie <marie@lab.org>\n';
  const buf = Buffer.from(input, 'utf8');
  const chunks = [];
  for (let i = 0; i < buf.length; i += 5) chunks.push(buf.subarray(i, i + 5));
  const text = await run(chunks);
  assert.equal(text, 'JEAN DUPONT <***@***>\nMARIE CURIE <***@***>\n');
});

test('derniere ligne sans \\n final est traitee dans _flush', async () => {
  const text = await run(['bob <bob@x.io>']);
  assert.equal(text, 'BOB <***@***>');
});

test('propage une erreur de la source a travers pipeline', async () => {
  const failing = new Readable({
    read() {
      this.destroy(new Error('boom'));
    },
  });
  await assert.rejects(() => pipeline(failing, new Anonymizer()), /boom/);
});
