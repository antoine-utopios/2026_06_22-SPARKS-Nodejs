// App catalogue produits CORRIGEE :
// - /produit/:id : cache LRU borne (max + ttl) + cle stable -> heap stable.
// - /remise/:montant : calcul CPU-bound (scale via cluster.js).
// - /health, /mem : observabilite.
import express from 'express';
import { LRUCache } from 'lru-cache';
import { calculerRemise, ITERATIONS } from './remise.js';

export const MAX_ENTREES = 500;

export function createApp({ iterations = ITERATIONS } = {}) {
  const app = express();

  // Cache borne : max 500 entrees, expiration 1 min. La taille plafonne,
  // les entrees evincees redeviennent eligibles au GC.
  const cacheVues = new LRUCache({ max: MAX_ENTREES, ttl: 1000 * 60 });

  app.get('/produit/:id', (req, res) => {
    const cle = req.params.id; // cle STABLE (pas de Date/random)
    let entree = cacheVues.get(cle);
    if (!entree) {
      entree = { id: cle, vu: new Date().toISOString(), blob: 'x'.repeat(10_000) };
      cacheVues.set(cle, entree);
    }
    res.json({ id: cle, entrees: cacheVues.size });
  });

  app.get('/remise/:montant', (req, res) => {
    const signature = calculerRemise(req.params.montant, iterations);
    res.json({ montant: req.params.montant, signature, pid: process.pid });
  });

  app.get('/health', (req, res) => res.json({ status: 'ok' }));

  app.get('/mem', (req, res) => {
    if (global.gc) global.gc();
    res.json({
      heapUsed_mo: Math.round(process.memoryUsage().heapUsed / 1e6),
      entrees: cacheVues.size,
    });
  });

  app.locals.tailleCache = () => cacheVues.size;
  return app;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  createApp().listen(3000, () => console.log('App sur http://localhost:3000'));
}
