# Exercice 7 (SOLUTION) - Correler les logs avec AsyncLocalStorage

Objectif : un `requestId` present dans tous les logs d'une requete Express, a
toutes les profondeurs d'appel, **sans le passer en parametre**.

## Idee cle

Une seule instance d'`AsyncLocalStorage` (`node:async_hooks`), partagee par toute
l'app. Un middleware ouvre un store par requete (`als.run(store, () => next())`).
`getRequestId()` lit le store courant via `als.getStore()` n'importe ou dans la
chaine asynchrone, meme apres des `await`.

## Fichiers

- `src/context.js` : instance unique, middleware, `log()` contextuel (logger injectable).
- `src/app.js` : route `/work` traversant route -> service -> fetchData.
- `src/server.js` : point d'entree (port 3000).

## Lancer / tester

```bash
npm install
npm start          # puis curl -H "x-request-id: A" localhost:3000/work
npm test           # node --test
```

Les tests injectent un logger espion et verifient avec 3 requetes concurrentes :
requestId distincts, 4 logs correctement correles par requete, aucune fuite de
contexte, UUID genere sans en-tete, et robustesse hors contexte.

## Pieges evites

- Plusieurs instances d'`AsyncLocalStorage` -> `getStore()` renvoie `undefined`.
- `next()` hors de `run()` -> requestId perdu apres le middleware.
- Variable globale au lieu du store -> identifiants ecrases en parallele.
- `getStore()` sans `?.` -> crash hors contexte.
