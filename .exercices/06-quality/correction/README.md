# Exercice 6 (SOLUTION) - Gestion d'erreurs centralisee

Corrige un code fragile qui avalait les erreurs (try/catch renvoyant null,
id reste une string, formatage disperse). On type les erreurs, on les laisse
remonter, et on centralise le formatage dans un middleware unique.

## Lancer

```bash
npm install
npm test          # node --test : classes d'erreurs + service + comportement HTTP
npm start         # http://localhost:3000
```

## Verifications manuelles

```bash
curl -i localhost:3000/articles/1     # 200 + article
curl -i localhost:3000/articles/abc   # 400 ValidationError
curl -i localhost:3000/articles/999   # 404 NotFoundError
curl -i localhost:3000/boom           # 500 message generique
```

## Points cles

- `src/errors.js` : `AppError` + `NotFoundError` (404), `ValidationError` (400),
  `ConflictError` (409), avec `statusCode`, `isOperational` et stack propre.
- `src/articleService.js` : convertit/valide l'id (`Number` + `Number.isInteger`),
  leve `ValidationError` / `NotFoundError`, n'avale plus rien.
- `src/app.js` : Express 4, donc handler async enveloppe d'`asyncHandler` pour
  propager les rejets vers le middleware.
- `src/errorHandler.js` : middleware a 4 args, enregistre en dernier, masque les
  erreurs non operationnelles cote client et les log cote serveur.
