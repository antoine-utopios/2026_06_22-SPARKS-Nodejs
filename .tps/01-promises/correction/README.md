# TP 1 — API Express structurée et sécurisée (solution)

API de gestion de tâches en architecture par couches :
`routes -> controllers -> services`, middleware d'erreur centralisé, guard JWT, validation Zod.

## Structure

```
src/
  app.js                    # création de l'app (testable, sans listen)
  server.js                 # point d'entrée (dotenv + listen)
  routes/                   # auth.routes.js, tasks.routes.js
  controllers/              # auth.controller.js, tasks.controller.js
  services/                 # auth.service.js, tasks.service.js (stockage mémoire)
  middlewares/              # erreurs.js (gestionErreurs + asyncHandler), guard.js, validate.js
test/
  api.test.js               # tests d'intégration via fetch (port 0)
```

## Lancer

```bash
npm install
npm test            # node:test : 401 sans token, login+création 201, 400 body invalide, 404...
cp .env.example .env
npm start           # API sur http://localhost:3000
```

## Routes

| Méthode | Route          | Auth   | Description                  |
| ------- | -------------- | ------ | ---------------------------- |
| POST    | `/auth/login`  | non    | `{login,password}` -> `{token}` |
| GET     | `/tasks`       | non    | liste les tâches             |
| GET     | `/tasks/:id`   | non    | une tâche (404 si absente)   |
| POST    | `/tasks`       | Bearer | crée une tâche (titre requis) |

Identifiants de démo : `demo` / `demo`.

> Les tests démarrent l'app sur le port 0 (libre) et utilisent `fetch` natif :
> aucune dépendance de test externe, pas de réseau sortant.
