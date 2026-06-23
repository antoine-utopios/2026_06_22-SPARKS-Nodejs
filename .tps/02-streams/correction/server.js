import express from 'express';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { PassThrough } from 'node:stream';
import { pipeline, finished } from 'node:stream/promises';
import { Anonymizer } from './anonymizer.js';

/**
 * Cree l'application Express.
 * @param {object} [opts]
 * @param {string} [opts.outDir] repertoire des fichiers de sortie (defaut: os.tmpdir()).
 */
export function createApp({ outDir = os.tmpdir() } = {}) {
  const app = express();

  // IMPORTANT : aucun body-parser (express.json / express.text) sur cette route,
  // sinon le corps de la requete serait bufferise avant d'atteindre le stream.
  app.post('/process', async (req, res) => {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');

    const outPath = path.join(outDir, `output-${Date.now()}-${process.pid}.txt`);
    const fileStream = fs.createWriteStream(outPath);
    const tee = new PassThrough();

    // Un PassThrough (Readable) diffuse chaque chunk a TOUS ses consommateurs `pipe`.
    // C'est la facon correcte de dupliquer un flux vers deux destinations.
    // Deux `pipeline(tee, ...)` se disputeraient les chunks : a proscrire.
    tee.pipe(res);
    tee.pipe(fileStream);

    try {
      // Un seul pipeline pilote l'amont, gere la backpressure et propage les erreurs.
      await pipeline(req, new Anonymizer(), tee);
      // pipeline se resout quand le tee a fini de pousser ; on attend la fin
      // reelle de l'ecriture disque avant de considerer le fichier complet.
      await finished(fileStream);
      console.log('Fichier ecrit :', outPath);
    } catch (err) {
      console.error('Erreur de traitement :', err.message);
      // Couper la diffusion vers le fichier et nettoyer le fichier partiel.
      tee.unpipe(fileStream);
      fileStream.destroy();
      fs.promises.unlink(outPath).catch(() => {});
      if (!res.headersSent) {
        res.status(500).end('Erreur de traitement');
      } else {
        res.destroy(err);
      }
    }
  });

  return app;
}

// Lancement direct : node server.js
if (import.meta.url === `file://${process.argv[1]}`) {
  const app = createApp({ outDir: '.' });
  app.listen(3000, () => console.log('En ecoute sur http://localhost:3000'));
}
