# Exercice 4 — Diagnostiquer un event loop bloqué

> Module 4 / Gestion de la performance — Difficulté 3/5

## Objectifs

- Proposer et implémenter une correction qui rend la main à l'event loop.

## Prérequis

- Node.js 20 ou 22 installé (`node --version`).
- Express 4 ou 5.
- Un client HTTP de charge : `autocannon` (`npm i -g autocannon`) ou plusieurs onglets `curl`.
- Notions de base : `async/await`, `worker_threads`, `setImmediate`.

## Contexte

On vous fournit un micro-service Express d'export comptable. Une route calcule un « score de conformité » via un algorithme volontairement coûteux (boucle de hachage répétée). En production, dès qu'un client appelle cette route, **toutes les autres requêtes du service deviennent lentes**, même un simple `GET /health`. L'équipe soupçonne un blocage de l'event loop mais ne sait pas le prouver ni le corriger.

Code fourni (`service.js`) :

```js
const express = require('express');
const crypto = require('node:crypto');
const app = express();

// Route saine, censée répondre instantanément
app.get('/health', (req, res) => {
  res.json({ status: 'ok', ts: Date.now() });
});

// Route problématique : calcul lourd SYNCHRONE
app.get('/score/:dossier', (req, res) => {
  let valeur = req.params.dossier;
  for (let i = 0; i < 5_000_000; i++) {
    valeur = crypto.createHash('sha256').update(valeur).digest('hex');
  }
  res.json({ dossier: req.params.dossier, score: valeur.slice(0, 12) });
});

app.listen(3000, () => console.log('Service sur http://localhost:3000'));
```

## Énoncé

### Partie 1 — Prouver le blocage

Démarrez le service. Pendant qu'une requête `GET /score/abc` est en cours, mesurez le temps de réponse de `GET /health`.

**Résultat attendu :** vous démontrez chiffres à l'appui que `/health` — normalement instantané — met plusieurs centaines de millisecondes (ou plus) à répondre tant que `/score` s'exécute. Vous expliquez pourquoi en une phrase.

### Partie 2 — Mesurer sous charge

Lancez `autocannon` sur `/health` pendant qu'un appel lourd à `/score` tourne en parallèle. Comparez la latence p99 et le débit avec et sans appel concurrent à `/score`.

**Résultat attendu :** un tableau avant/après montrant l'effondrement du débit et la hausse de la latence p99 sur `/health` lorsque l'event loop est occupé par le calcul synchrone.

### Partie 3 — Corriger sans bloquer

Modifiez la route `/score` pour qu'elle ne bloque plus l'event loop, tout en renvoyant le même résultat. Au moins une approche au choix : découpe du calcul par lots avec `setImmediate`, ou déport dans un `worker_threads`.

**Résultat attendu :** pendant l'exécution d'un `/score`, `GET /health` reste rapide (latence stable). Vous justifiez le choix entre découpe coopérative et worker thread.

## Indices

<details>
<summary>Indice 1 — Comment mesurer la latence de /health pendant /score</summary>

Ouvrez deux terminaux. Dans le premier, lancez l'appel lourd : `curl http://localhost:3000/score/abc`. Immédiatement, dans le second, chronométrez le health check : `curl -w "%{time_total}\n" -o /dev/null -s http://localhost:3000/health`.
</details>

<details>
<summary>Indice 2 — Pourquoi /health est lent</summary>

Node.js exécute le JavaScript sur un seul thread. La boucle de hachage est synchrone : tant qu'elle tourne, l'event loop ne peut traiter aucun autre callback, y compris la réponse à `/health`.
</details>

<details>
<summary>Indice 3 — Découpe coopérative avec setImmediate</summary>

Transformez la boucle en fonction asynchrone qui traite N itérations puis cède la main : `await new Promise((r) => setImmediate(r));` toutes les quelques dizaines de milliers d'itérations. L'event loop peut alors intercaler d'autres requêtes entre les lots.
</details>

<details>
<summary>Indice 4 — Déport dans un worker thread</summary>

Créez un fichier worker qui reçoit le dossier via `workerData`, exécute la boucle, et renvoie le résultat avec `parentPort.postMessage`. Dans la route, instanciez un `new Worker(...)` et résolvez une promesse sur l'événement `message`.
</details>

## Pour aller plus loin

- Mesurez le « lag » de l'event loop avec `perf_hooks.monitorEventLoopDelay()` et exposez-le sur une route `/metrics`.
- Comparez les performances des deux approches (setImmediate vs worker) sous forte concurrence : laquelle préserve le mieux le débit global ?
- Ajoutez un pool de workers (réutilisation) plutôt qu'un worker créé à chaque requête, et observez l'impact sur la latence.
