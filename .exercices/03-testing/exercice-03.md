# Exercice 3 — Tester un service asynchrone avec mocks et stubs

> Module 3 — Tests avec Node.js
> Durée : 45 minutes
> Difficulté : 3/5
> Type : Exercice de code dirigé

## Objectifs

- Écrire des tests unitaires isolés pour un service asynchrone
- Remplacer un repository et une API externe par des stubs sinon
- Vérifier le comportement (valeurs renvoyées) et les interactions (appels)
- Garantir l'isolation entre les tests avec des hooks

## Prérequis

- Node.js 20 ou 22 installé
- Connaissance de `async/await` et des promesses
- Notions de base sur les doublures de test (spy, stub, mock)
- Un projet avec `sinon` installé (`npm i -D sinon`)

## Contexte

Vous reprenez un module `UserService` d'une API Express. Ce service récupère un
utilisateur via un `userRepository` (accès base de données) puis enrichit ses
données via un `geoApi` (API externe de géolocalisation). Vous ne voulez ni
toucher la base, ni appeler le réseau pendant les tests : les deux dépendances
doivent être stubbées.

Le service vous est fourni, déjà conçu avec injection de dépendances :

```js
// src/user-service.js
export class UserService {
  constructor(userRepository, geoApi) {
    this.userRepository = userRepository;
    this.geoApi = geoApi;
  }

  async getEnrichedUser(id) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }
    const location = await this.geoApi.locate(user.ip);
    return { ...user, country: location.country };
  }
}
```

## Énoncé

### Partie 1 — Cas nominal isolé

Écrivez un test qui vérifie que `getEnrichedUser(1)` renvoie l'utilisateur
enrichi du pays.

- Créez des stubs pour `userRepository.findById` et `geoApi.locate`.
- `findById` doit résoudre `{ id: 1, name: "Ada", ip: "8.8.8.8" }`.
- `locate` doit résoudre `{ country: "US" }`.
- Instanciez `UserService` avec ces deux doublures.

**Résultat attendu :** le test passe et l'objet renvoyé contient `country: "US"`
ainsi que les champs d'origine de l'utilisateur.

### Partie 2 — Vérifier les interactions

Complétez le test de la partie 1 pour vérifier que :

- `findById` a été appelé exactement une fois, avec l'argument `1`.
- `locate` a été appelé avec l'IP de l'utilisateur (`"8.8.8.8"`).

**Résultat attendu :** les assertions sur les appels passent ; un changement
dans l'ordre ou les arguments des appels ferait échouer le test.

### Partie 3 — Cas d'erreur et isolation

Ajoutez un test pour le cas où l'utilisateur n'existe pas.

- `findById` résout `null`.
- L'appel doit rejeter avec le message `USER_NOT_FOUND`.
- `geoApi.locate` ne doit jamais être appelé.
- Mettez en place des hooks pour que chaque test parte d'un état propre
  (restauration des stubs entre les tests).

**Résultat attendu :** le test du cas d'erreur passe, et l'exécution de la suite
complète (parties 1 à 3) reste fiable quel que soit l'ordre des tests.

## Indices

<details>
<summary>Indice 1 — Créer des stubs sans objet réel</summary>

Vous n'avez pas besoin des vraies implémentations. Un objet anonyme suffit :

```js
const userRepository = { findById: sinon.stub() };
const geoApi = { locate: sinon.stub() };
userRepository.findById.resolves({ id: 1, name: "Ada", ip: "8.8.8.8" });
```
</details>

<details>
<summary>Indice 2 — Vérifier les appels</summary>

Les stubs sinon exposent des assertions sur leurs appels :

```js
assert.ok(userRepository.findById.calledOnceWith(1));
assert.ok(geoApi.locate.calledWith("8.8.8.8"));
assert.equal(geoApi.locate.callCount, 0); // jamais appelé
```
</details>

<details>
<summary>Indice 3 — Tester un rejet et restaurer l'état</summary>

Pour vérifier qu'une promesse rejette :

```js
await assert.rejects(
  () => service.getEnrichedUser(99),
  /USER_NOT_FOUND/
);
```

Et pour repartir propre entre les tests, appelez `sinon.restore()` dans un
`afterEach`, ou recréez les stubs dans un `beforeEach`.
</details>

## Pour aller plus loin

- Remplacez les stubs par un `sinon.mock` avec attentes vérifiées via `verify()`.
- Ajoutez un cache : si `getEnrichedUser` est appelé deux fois avec le même id,
  `findById` ne doit être appelé qu'une fois. Testez ce comportement.
- Simulez une panne de l'API externe (`locate` rejette) et décidez du
  comportement attendu : propagation de l'erreur ou valeur par défaut.