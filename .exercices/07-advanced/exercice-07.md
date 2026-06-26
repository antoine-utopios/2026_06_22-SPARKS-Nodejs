# Exercice 7 — Corréler les logs d'une requête avec AsyncLocalStorage

> Module 7 / Modules avancés — Exercice d'application. Difficulté 3/5.

## Objectifs

- Mettre en place un `AsyncLocalStorage` pour propager un `requestId` le long de la chaîne asynchrone d'une requête Express
- Injecter ce `requestId` dans tous les logs sans le passer en paramètre à chaque fonction
- Comprendre le rôle d'Async Hooks comme mécanisme sous-jacent

## Prérequis

- Node.js 20 ou 22
- Connaissances de base d'Express 4
- Notions sur l'asynchrone (Promises, async/await)

## Contexte

Vous maintenez une API Express dont les logs sont illisibles : quand plusieurs requêtes arrivent en parallèle, leurs lignes de log s'entremêlent et il devient impossible de savoir quelle ligne appartient à quelle requête. Passer un identifiant en paramètre à chaque fonction (couche route, service, accès données) serait fastidieux et fragile.

`AsyncLocalStorage` (module `node:async_hooks`) permet d'attacher un contexte à une requête et de le récupérer n'importe où dans la pile d'appels déclenchée par cette requête.

## Énoncé

### Partie 1 — Mise en place du store

Créez un module `context.js` qui exporte une instance unique d'`AsyncLocalStorage` et une fonction `getRequestId()` retournant l'identifiant courant (ou `undefined` hors contexte).

Résultat attendu : un module réutilisable, instancié une seule fois pour toute l'application.

### Partie 2 — Middleware de corrélation

Écrivez un middleware Express qui, pour chaque requête :

- récupère l'en-tête `x-request-id` s'il existe, sinon génère un UUID
- ouvre un store contenant ce `requestId`
- exécute la suite du traitement (`next`) à l'intérieur de `als.run(...)`

Résultat attendu : chaque requête dispose de son propre `requestId` isolé, même en cas de requêtes simultanées.

### Partie 3 — Logger contextuel et route de démonstration

Créez une fonction `log(message)` qui préfixe automatiquement le message avec le `requestId` courant (format JSON), sans recevoir l'identifiant en paramètre.

Ajoutez une route `GET /work` qui appelle une fonction de service asynchrone (avec au moins un `await` ou un `setTimeout`), laquelle appelle `log()` à plusieurs profondeurs d'appel.

Résultat attendu : en lançant plusieurs requêtes en parallèle (par exemple avec des en-têtes `x-request-id` différents), chaque ligne de log porte le bon `requestId`, sans aucun mélange.

## Indices

<details>
<summary>Indice 1 — Instance unique</summary>

`AsyncLocalStorage` doit être instancié une seule fois et partagé (import du même module). Une nouvelle instance par requête ne fonctionnerait pas.

```js
import { AsyncLocalStorage } from "node:async_hooks";
export const als = new AsyncLocalStorage();
```

</details>

<details>
<summary>Indice 2 — run et getStore</summary>

`als.run(store, callback)` exécute `callback` (et tout ce qu'il déclenche en asynchrone) avec `store` accessible via `als.getStore()`. Dans le middleware, appelez `next` à l'intérieur du callback.

</details>

<details>
<summary>Indice 3 — Génération d'identifiant</summary>

`crypto.randomUUID()` (module `node:crypto`) génère un UUID v4 sans dépendance externe.

</details>

<details>
<summary>Indice 4 — Async Hooks</summary>

`AsyncLocalStorage` repose sur `async_hooks`, qui suit le cycle de vie des ressources asynchrones (`init`, `before`, `after`, `destroy`). Vous n'avez pas à manipuler ces hooks directement ici : `AsyncLocalStorage` les gère pour vous.

</details>

## Pour aller plus loin

- Ajoutez d'autres champs au store (utilisateur authentifié, horodatage de début) et calculez la durée totale de la requête au moment de répondre.
- Branchez votre logger sur un vrai logger structuré (pino, winston) en injectant le `requestId` via un formateur.
- Mesurez le surcoût d'`AsyncLocalStorage` sous charge et comparez avec un passage explicite de paramètre.
