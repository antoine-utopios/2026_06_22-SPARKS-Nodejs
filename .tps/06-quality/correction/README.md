# TP 6 (SOLUTION) - API Express outillee

`tp06-quality` : API catalogue produits outillee pour le debug, le profiling,
le lint et la gestion d'erreurs robuste.

## Installer / tester / linter

```bash
npm install
npm test          # node --test : comportement HTTP + classes + middleware + handlers de process
npm run lint      # eslint . : 0 erreur bloquante
npm start         # http://localhost:3000
```

## Etape 1 - Debug pas a pas

```bash
npm run debug     # = node --inspect-brk src/server.js
```

Process suspendu au demarrage. Lancer la config VS Code (`.vscode/launch.json` :
"Debug API" en launch ou "Attach 9229"), poser un breakpoint dans
`src/routes/products.js` sur `const product = products.find(...)`, puis :

```bash
curl http://localhost:3000/products/2
```

Inspecter `req.params.id` dans la vue Variables/Watch.

> Documente mais non execute en CI : le debug interactif n'est pas automatisable.

## Etape 2 - Profiling de la route lente

`GET /products/report` appelle `buildReport` (boucle synchrone) dans
`src/routes/products.js`.

```bash
# Option A - log V8 brut puis rapport
node --prof src/server.js &
npx autocannon -d 8 http://localhost:3000/products/report
kill %1
node --prof-process isolate-0x*.log > processed.txt   # buildReport domine les ticks JS

# Option B - .cpuprofile (DevTools > Performance)
npm run cpu-profile

# Option C - clinic
npx clinic flame -- node src/server.js                # buildReport = barre la plus large
```

Penser a supprimer les `isolate-*.log` apres coup.

> Documente mais non execute en CI : generation/lecture des profils interactives.
> En test, on verifie que `/products/report` repond 200 (`?iterations=` reduit).

## Etape 3 - Lint et erreurs robustes

- `eslint.config.js` (flat config ESLint 9) : `no-unused-vars`, `eqeqeq`,
  `complexity`, `max-depth`. `npm run lint` ne remonte aucune erreur bloquante.
- `src/errors.js` : `AppError`, `NotFoundError` (404), `ValidationError` (400).
- `src/middleware/errorHandler.js` : middleware a 4 args, enregistre en dernier.
- `src/processHandlers.js` + `src/server.js` : `uncaughtException`,
  `unhandledRejection` (testes via `process.listenerCount` / emit) et arret
  propre sur `SIGTERM`.

```bash
curl -i http://localhost:3000/products/1     # 200
curl -i http://localhost:3000/products/abc   # 400
curl -i http://localhost:3000/products/999   # 404
```
