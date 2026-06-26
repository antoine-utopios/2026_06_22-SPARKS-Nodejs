# TP 7 (SOLUTION) - Service de calcul signe expose en flux

Combine trois modules avances dans une route Express :

- **Worker Threads** (`node:worker_threads`) : calcul CPU lourd (fibonacci)
  deporte, l'event loop reste libre.
- **Crypto** (`node:crypto`) : resultat signe en Ed25519, verifiable avec la cle
  publique exposee.
- **Web Streams API** : `ReadableStream` produit le corps, converti en stream Node
  via `Readable.fromWeb(...).pipe(res)` pour Express 4.

## Fichiers

- `src/worker.js` : calcul fibonacci execute dans le worker.
- `src/compute.js` : `runComputation()` deporte sur un Worker Thread.
- `src/signer.js` : sign/verify Ed25519, export cle publique PEM.
- `src/stream.js` : `jsonWebStream()` (ReadableStream) + utilitaire de lecture.
- `src/app.js` : routes `/compute` et `/public-key` ; payload canonique signe.
- `src/server.js` : point d'entree (port 3000).

## Lancer / tester

```bash
npm install
npm start
curl "http://localhost:3000/compute?input=35"
curl "http://localhost:3000/public-key"
npm test          # node --test
```

## Couverture des tests (conteneur)

- Worker : resultat correct + thread principal reste reactif (ticks de timer
  pendant le calcul) + deux calculs concurrents.
- Crypto : signature valide -> true ; donnee alteree -> false.
- Web Streams : le `ReadableStream` produit le JSON attendu.
- Serveur (fetch sur port 0) : `/compute` renvoie le flux signe verifiable de bout
  en bout, validation des entrees (400), `/public-key`.

## Survol / non teste en conteneur

- Pool de workers, backpressure (plusieurs `enqueue`) : variantes evoquees.
- TLS reel et C++ addons : survol documentaire uniquement.
