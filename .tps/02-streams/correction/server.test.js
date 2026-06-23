import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createApp } from './server.js';

function makeOutDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'tp-streams-'));
}

async function withServer(outDir, fn) {
  const server = createApp({ outDir }).listen(0);
  await new Promise((r) => server.once('listening', r));
  const { port } = server.address();
  try {
    await fn(port);
  } finally {
    await new Promise((r) => server.close(r));
  }
}

function readOutputs(dir) {
  return fs
    .readdirSync(dir)
    .filter((f) => f.startsWith('output-'))
    .map((f) => fs.readFileSync(path.join(dir, f), 'utf8'));
}

test('POST /process : reponse transformee + fichier identique (cas nominal)', async () => {
  const outDir = makeOutDir();
  await withServer(outDir, async (port) => {
    const body = 'jean dupont <jean@acme.fr>\nmarie curie <marie@lab.org>\n';
    const res = await fetch(`http://127.0.0.1:${port}/process`, {
      method: 'POST',
      body,
    });
    assert.equal(res.status, 200);
    const text = await res.text();
    const expected = 'JEAN DUPONT <***@***>\nMARIE CURIE <***@***>\n';
    assert.equal(text, expected);

    // Laisser le temps a `finished(fileStream)` d'ecrire le fichier.
    await new Promise((r) => setTimeout(r, 100));
    const files = readOutputs(outDir);
    assert.equal(files.length, 1);
    assert.equal(files[0], expected, 'le fichier doit contenir le meme resultat que la reponse');
  });
});

test('POST /process : pas de body-parser, le corps brut est bien streame', async () => {
  const outDir = makeOutDir();
  await withServer(outDir, async (port) => {
    // Envoi d'un corps "volumineux" multi-chunks pour eprouver le decoupage en lignes.
    const lines = [];
    for (let i = 0; i < 5000; i++) lines.push(`user${i} <u${i}@mail.com>`);
    const body = lines.join('\n') + '\n';
    const res = await fetch(`http://127.0.0.1:${port}/process`, {
      method: 'POST',
      body,
    });
    const text = await res.text();
    const outLines = text.split('\n').filter(Boolean);
    assert.equal(outLines.length, 5000, 'aucune ligne ne doit etre perdue ni tronquee');
    assert.equal(outLines[0], 'USER0 <***@***>');
    assert.equal(outLines[4999], 'USER4999 <***@***>');
  });
});

test('le serveur reste disponible apres une requete (pas de fuite/crash)', async () => {
  const outDir = makeOutDir();
  await withServer(outDir, async (port) => {
    for (let i = 0; i < 3; i++) {
      const res = await fetch(`http://127.0.0.1:${port}/process`, {
        method: 'POST',
        body: `req${i} <r${i}@x.io>\n`,
      });
      assert.equal(res.status, 200);
      assert.equal(await res.text(), `REQ${i} <***@***>\n`);
    }
  });
});
