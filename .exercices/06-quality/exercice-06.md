# Exercice 6 — Gestion d'erreurs centralisée et code fragile

> Module 6 / Contrôle de qualité — Difficulté 3/5

## Objectifs

- Concevoir une hiérarchie de classes d'erreurs avec statut HTTP et flag opérationnel
- Mettre en place un middleware d'erreur Express centralisé
- Identifier et corriger un code qui avale silencieusement les erreurs

## Prérequis

- Node.js 20 ou 22 installé
- Express 4 ou 5
- Connaissance des middlewares Express et des promesses async/await

## Contexte

Vous reprenez une petite API de gestion d'articles. Le code « fonctionne » mais avale les erreurs : les `try/catch` retournent `null` ou un `200` même en cas de problème, les routes async ne propagent pas leurs rejets, et chaque route formate ses erreurs à sa manière. Le résultat : des bugs invisibles en production et des réponses incohérentes.

Vous devez rendre la gestion d'erreurs explicite, typée et centralisée.

## Énoncé

### Partie 1 — Hiérarchie de classes d'erreurs

Créez un module `errors.js` exposant :

- une classe de base `AppError` portant `statusCode`, `isOperational` et une stack propre
- `NotFoundError` (404), `ValidationError` (400) et `ConflictError` (409) qui en héritent

Résultat attendu : `new NotFoundError('Article 7 introuvable')` produit une instance dont `statusCode === 404` et `isOperational === true`, et dont le `name` reflète la classe.

### Partie 2 — Code fragile à corriger

On vous fournit ce service et cette route à assainir :

```js
// articleService.js — version fragile
const articles = [{ id: 1, title: "Node" }];

export async function getArticle(id) {
  try {
    const found = articles.find((a) => a.id === id);
    return found;          // renvoie undefined silencieusement si absent
  } catch (e) {
    return null;           // avale toute erreur
  }
}

// route fragile
app.get("/articles/:id", async (req, res) => {
  const article = await getArticle(req.params.id); // id reste une string
  res.json(article);        // renvoie 200 + null si introuvable
});
```

Réécrivez `getArticle` et la route pour :

- convertir et valider l'identifiant (lever une `ValidationError` si non numérique)
- lever une `NotFoundError` quand l'article n'existe pas
- ne plus avaler les erreurs : laisser remonter ce qui n'est pas géré
- déléguer le formatage de la réponse au middleware d'erreur

Résultat attendu : `GET /articles/abc` renvoie un 400, `GET /articles/999` renvoie un 404 avec un message clair, `GET /articles/1` renvoie l'article en 200.

### Partie 3 — Middleware d'erreur centralisé

Ajoutez un middleware d'erreur unique, enregistré après les routes, qui :

- déduit le statut HTTP à partir de l'erreur (défaut 500)
- masque le détail des erreurs non opérationnelles dans la réponse tout en les loggant intégralement côté serveur
- renvoie un JSON cohérent `{ error: "..." }`

Résultat attendu : une erreur inattendue (bug) renvoie un 500 avec un message générique mais une trace complète dans les logs ; une `ValidationError` renvoie son message tel quel.

## Indices

<details>
<summary>Indice 1 — Stack propre</summary>

`Error.captureStackTrace(this, this.constructor)` retire le constructeur de la stack, qui pointe alors sur l'appelant réel.

</details>

<details>
<summary>Indice 2 — Propager les rejets async</summary>

En Express 5, un rejet dans un handler `async` part automatiquement vers le middleware d'erreur. En Express 4, enveloppez le handler : `const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);`

</details>

<details>
<summary>Indice 3 — Distinguer le type d'erreur</summary>

Dans le middleware, testez `err.isOperational`. Les erreurs non issues d'`AppError` (donc sans ce flag) sont à considérer comme des bugs : statut 500 et message générique côté client.

</details>

## Pour aller plus loin

- Ajoutez un identifiant de corrélation (`requestId`) propagé dans les logs d'erreur
- Centralisez la traduction des erreurs de la couche données (ex : violation de contrainte unique) vers une `ConflictError`
- Ajoutez un test qui vérifie que `GET /articles/abc` répond bien 400
