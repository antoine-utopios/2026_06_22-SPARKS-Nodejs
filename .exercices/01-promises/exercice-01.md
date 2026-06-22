# Exercice 1 — Du callback hell aux promesses puis à async/await

> Module 1 · Durée : 45 min · Difficulté : 2/5 · Type : Exercice d'application

## Objectifs pédagogiques

- Identifier et corriger l'imbrication de callbacks (callback hell)
- Transformer du code basé sur les callbacks en promesses, puis en `async`/`await`
- Mettre en place une gestion d'erreurs centralisée
- Maîtriser la parallélisation avec `Promise.all` quand les tâches sont indépendantes

## Prérequis

- Node.js 20 ou 22 LTS installé (`node --version`)
- Connaissances de base sur les modules `node:fs` et `fetch`
- Un éditeur de code

## Contexte

On dispose d'un petit pipeline de traitement écrit à l'ancienne, en callbacks imbriqués. Il doit :

1. Lire un fichier local `entree.json` contenant une liste d'identifiants d'utilisateurs
2. Pour chaque identifiant, récupérer les données de l'utilisateur via un appel HTTP
3. Écrire un fichier `sortie.json` contenant la liste consolidée

Le code de départ fonctionne mais est difficile à maintenir, gère mal les erreurs et appelle l'API séquentiellement alors que les appels sont indépendants.

Code de départ (à refactorer) :

```js
const fs = require("node:fs");

fs.readFile("entree.json", "utf8", (err, contenu) => {
  if (err) return console.error("Erreur lecture", err);
  const ids = JSON.parse(contenu).ids;
  const resultats = [];
  let restants = ids.length;

  ids.forEach((id) => {
    fetch(`https://jsonplaceholder.typicode.com/users/${id}`)
      .then((r) => r.json())
      .then((user) => {
        resultats.push(user);
        restants -= 1;
        if (restants === 0) {
          fs.writeFile(
            "sortie.json",
            JSON.stringify(resultats, null, 2),
            (err) => {
              if (err) return console.error("Erreur écriture", err);
              console.log("Terminé");
            }
          );
        }
      });
  });
});
```

Fichier `entree.json` à créer pour tester :

```json
{ "ids": [1, 2, 3, 4, 5] }
```

## Énoncé

### Partie 1 — Réécriture en promesses

Réécrivez le pipeline en utilisant uniquement les promesses (`.then`/`.catch`), sans `async`/`await` :

- Utilisez `node:fs/promises` pour la lecture et l'écriture
- Lancez les appels HTTP en parallèle et attendez-les tous avec `Promise.all`
- Centralisez la gestion d'erreur dans un unique `.catch` final

Résultat attendu : un fichier `sortie.json` contenant les 5 utilisateurs, et une seule branche de gestion d'erreur. Aucune imbrication superflue.

### Partie 2 — Réécriture en async/await

Réécrivez maintenant la même logique sous forme d'une fonction `async` :

- Utilisez `await` pour la lecture du fichier
- Conservez la parallélisation des appels HTTP via `Promise.all`
- Encadrez le tout d'un seul `try`/`catch`
- Faites en sorte que le process se termine avec un code d'erreur (`process.exitCode = 1`) en cas d'échec

Résultat attendu : le même `sortie.json` qu'en partie 1, un code plus court et linéaire, et une gestion d'erreur unique qui n'avale pas l'erreur silencieusement.

## Indices (à consulter si bloqué)

<details>
<summary>Indice 1</summary>

Pour lire/écrire avec des promesses, importez le bon module :

```js
const fs = require("node:fs/promises");
const contenu = await fs.readFile("entree.json", "utf8");
```

</details>

<details>
<summary>Indice 2</summary>

Pour lancer les appels en parallèle, transformez le tableau d'identifiants en tableau de promesses, puis attendez l'ensemble :

```js
const promesses = ids.map((id) =>
  fetch(`https://jsonplaceholder.typicode.com/users/${id}`).then((r) => r.json())
);
const utilisateurs = await Promise.all(promesses);
```

</details>

<details>
<summary>Indice 3</summary>

En version promesses pure, chaînez les étapes et terminez par un unique `.catch` :

```js
fs.readFile("entree.json", "utf8")
  .then((contenu) => JSON.parse(contenu).ids)
  .then((ids) => Promise.all(ids.map(recupererUser)))
  .then((users) => fs.writeFile("sortie.json", JSON.stringify(users, null, 2)))
  .then(() => console.log("Terminé"))
  .catch((err) => console.error("Échec du pipeline", err));
```

</details>

<details>
<summary>Indice 4</summary>

Vérifiez le statut HTTP avant de parser, sinon une erreur réseau passe inaperçue :

```js
async function recupererUser(id) {
  const r = await fetch(`https://jsonplaceholder.typicode.com/users/${id}`);
  if (!r.ok) throw new Error(`HTTP ${r.status} pour l'id ${id}`);
  return r.json();
}
```

</details>

## Pour aller plus loin (bonus)

- Remplacez `Promise.all` par `Promise.allSettled` et écrivez deux fichiers : `sortie.json` (succès) et `erreurs.json` (échecs), pour ne pas tout perdre si un seul appel échoue.
- Ajoutez un timeout sur chaque appel HTTP grâce à `AbortController` (2 secondes), et gérez l'annulation proprement.
- Limitez la concurrence à 2 appels simultanés (utile quand l'API limite le débit) en écrivant une petite fonction de pool, sans dépendance externe.