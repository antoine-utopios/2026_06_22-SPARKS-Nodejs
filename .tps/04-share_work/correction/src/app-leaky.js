// Version FUYANTE fournie aux apprenants (etape 1 : reproduire/profiler la fuite).
// cacheVues est un objet global non borne, indexe par une cle unique a chaque
// requete -> les entrees s'accumulent indefiniment (retenues par la reference
// globale, donc jamais collectees par le GC).
import express from 'express';

export function createLeakyApp() {
  const app = express();
  const cacheVues = {};

  app.get('/produit/:id', (req, res) => {
    const cle = `${req.params.id}-${Date.now()}-${Math.random()}`;
    cacheVues[cle] = {
      id: req.params.id,
      vu: new Date().toISOString(),
      blob: 'x'.repeat(10_000),
    };
    res.json({ id: req.params.id, entrees: Object.keys(cacheVues).length });
  });

  app.get('/health', (req, res) => res.json({ status: 'ok' }));

  app.locals.tailleCache = () => Object.keys(cacheVues).length;
  return app;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  createLeakyApp().listen(3000, () => console.log('App (leaky) sur http://localhost:3000'));
}
