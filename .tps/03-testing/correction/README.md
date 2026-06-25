# Module 3 — TP : couvrir une API Express de tests, du unitaire au fonctionnel

API Express de gestion de tâches, testable par injection de dépendances
(`createApp(taskService)`, `WeatherApi` injectable). Couverte par des tests
unitaires de service, des tests de routes (supertest), et un test fonctionnel
headless (Playwright).

## Structure

```
tp/
├── package.json
├── playwright.config.js
├── public/index.html
├── src/{app,server,task-service,weather-api}.js
└── tests/{task-service,tasks.routes,tasks.e2e}.test.js
```

## Ce que couvre `npm test`

```bash
npm install
npm test
```

`npm test` lance `node --test tests/task-service.test.js tests/tasks.routes.test.js` :

- **task-service** (2 tests) : création enrichie de la météo via stub async ;
  rejet sans titre + court-circuit (`forecast` non appelé).
- **tasks.routes** (3 tests) : `POST /tasks` 201 avec API externe stubbée,
  `POST /tasks` 400 sans titre, `GET /tasks` liste. supertest monte l'app en
  mémoire, sans port ni réseau réel.

Résultat attendu : 5 tests verts, en quelques dizaines de millisecondes.

## Test fonctionnel headless (Playwright) — HORS conteneur

`tests/tasks.e2e.test.js` + `playwright.config.js` couvrent le parcours d'ajout
d'une tâche depuis l'interface.

**Volontairement exclu de `npm test`** : le script ne cible que les deux fichiers
de tests unitaires/routes, donc le fichier e2e n'est jamais chargé par
`node --test`. Playwright exige un navigateur Chromium indisponible dans le
conteneur `node:20-alpine` — `npm test` passe donc sans navigateur.

Pour l'exécuter sur une machine de dev :

```bash
npm install -D @playwright/test
npx playwright install chromium
npm run test:e2e   # playwright démarre le serveur (webServer) puis teste
```

> Note (cf. solution formateur) : des configs Mocha/Jest sont possibles
> (`.mocharc.json`, `jest.config.js`). Ici on retient `node:test` natif pour
> garantir `npm test` sans dépendance lourde dans le conteneur.
