# Module 3 — Exercice : tester un service asynchrone avec mocks et stubs

Solution complète. `UserService` orchestre un `userRepository` (base) et un
`geoApi` (API externe) — tous deux injectés, donc stubbables. On ne teste jamais
les vraies dépendances : uniquement la logique d'orchestration.

## Structure

```
exercice/
├── package.json
├── src/user-service.js
└── tests/user-service.test.js
```

## Lancer les tests

```bash
npm install   # installe sinon
npm test      # node --test
```

## Ce qui est couvert (5 tests, tous verts, sans réseau)

- **Partie 1** : cas nominal, `deepEqual` sur l'objet enrichi.
- **Partie 2** : interactions, `calledOnceWithExactly`.
- **Partie 3** : cas d'erreur (`assert.rejects`) + court-circuit (`callCount === 0`).
- **Variante** : `sinon.mock` avec attentes a priori vérifiées par `verify()`.
- **Bonus** : cache — `findById` appelé une seule fois sur deux appels.

L'isolation repose sur `beforeEach` (stubs/service neufs) + `afterEach`
(`sinon.restore()`). Aucune partie headless dans cet exercice.
