import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ici = dirname(fileURLToPath(import.meta.url));
const clusterPath = join(ici, '..', 'src', 'cluster.js');

test('le cluster forke N workers, repartit les requetes et relance un worker mort', { timeout: 60_000 }, async () => {
  const PORT = 34601;
  const lignes = [];
  const enfant = spawn(process.execPath, [clusterPath], {
    env: { ...process.env, WORKERS: '2', PORT: String(PORT) },
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  enfant.stdout.setEncoding('utf8');
  enfant.stdout.on('data', (chunk) => {
    for (const ligne of chunk.split('\n')) if (ligne.trim()) lignes.push(ligne.trim());
  });

  const attendre = (predicat, ms, message) =>
    new Promise((resolve, reject) => {
      const debut = Date.now();
      const iv = setInterval(() => {
        if (predicat()) {
          clearInterval(iv);
          resolve();
        } else if (Date.now() - debut > ms) {
          clearInterval(iv);
          reject(new Error(message));
        }
      }, 50);
    });

  try {
    // 1) Deux workers en ecoute.
    await attendre(
      () => lignes.filter((l) => l.includes('en ecoute')).length >= 2,
      20_000,
      'les 2 workers ne sont pas en ecoute a temps',
    );

    // 2) Repartition : plusieurs pid distincts servent les requetes concurrentes.
    const reponses = await Promise.all(
      Array.from({ length: 12 }, () =>
        fetch(`http://127.0.0.1:${PORT}/remise/1000`).then((r) => r.json()),
      ),
    );
    const pidsAvant = new Set(reponses.map((r) => r.pid));
    assert.ok(pidsAvant.size >= 2, `attendu >= 2 pid distincts, obtenu ${pidsAvant.size}`);

    // 3) Resilience : on tue un worker -> le primaire le relance.
    const unPid = [...pidsAvant][0];
    process.kill(unPid, 'SIGKILL');
    await attendre(
      () => lignes.some((l) => l.includes('relance')),
      15_000,
      'aucun message de relance apres la mort d un worker',
    );

    // Laisse le worker de remplacement finir son handshake IPC avant l'arret.
    await attendre(
      () => lignes.filter((l) => l.includes('en ecoute')).length >= 3,
      15_000,
      'le worker de remplacement n a pas pris l ecoute',
    );

    // Le service repond toujours apres relance.
    const apres = await (await fetch(`http://127.0.0.1:${PORT}/health`)).json();
    assert.equal(apres.status, 'ok');
  } finally {
    // Arret PROPRE : SIGTERM -> le primaire stoppe le re-fork et coupe ses workers.
    enfant.kill('SIGTERM');
    await new Promise((r) => enfant.once('exit', r)).catch(() => {});
  }
});
