# Exercice 2 — Transformer un flux CSV à la volée avec un Transform stream

> **Module 2** — Streams Node.js
> **Durée** : 45 minutes
> **Difficulté** : 3/5
> **Type** : Exercice de mise en pratique

## Objectifs pédagogiques

- Implémenter un `Transform` stream personnalisé en étendant la classe `Transform`
- Gérer correctement le buffering ligne par ligne d'un flux découpé en chunks arbitraires
- Appliquer une transformation (mise en majuscules d'une colonne) et un filtrage de lignes à la volée
- Chaîner le Transform entre une source et une destination sans charger le fichier entier en mémoire

## Prérequis

- Node.js 20 ou 22 installé (`node --version`)
- Connaissance des modules `node:stream` et `node:fs`
- Compréhension de la section 3 du module (méthode `_transform`, `_flush`, `this.push`)

## Contexte

Vous recevez quotidiennement un export CSV des utilisateurs de l'entreprise. Le fichier peut atteindre plusieurs centaines de mégaoctets. On vous demande de produire un fichier nettoyé en :

1. mettant en majuscules le contenu de la colonne `country`,
2. supprimant les lignes dont la colonne `active` vaut `false`.

Le traitement doit être réalisé **en streaming**, sans jamais charger l'intégralité du fichier en mémoire.

Format du fichier source `users.csv` :

```csv
id,name,country,active
1,Alice,france,true
2,Bob,germany,false
3,Carla,spain,true
4,David,italy,true
5,Eve,portugal,false
```

## Énoncé

### Partie 1 — Préparer le jeu de données

Créez un fichier `users.csv` reprenant l'exemple ci-dessus (vous pouvez ajouter davantage de lignes).

**Résultat attendu :** un fichier CSV valide avec une ligne d'en-tête et au moins 5 lignes de données.

### Partie 2 — Implémenter le Transform stream

Créez une classe `CsvCleaner` étendant `Transform`. Elle doit :

- conserver la ligne d'en-tête telle quelle et la réémettre en première position,
- reconstituer les lignes complètes même quand un chunk coupe une ligne en deux,
- pour chaque ligne de données : mettre `country` en majuscules et ne réémettre que les lignes où `active === 'true'`,
- vider tout reliquat de buffer dans `_flush`.

**Résultat attendu :** une classe instanciable, configurée pour travailler en mode texte, dont chaque écriture produit en sortie les lignes transformées et filtrées.

### Partie 3 — Chaîner lecture, transformation et écriture

Branchez `fs.createReadStream('users.csv')` vers votre `CsvCleaner`, puis vers `fs.createWriteStream('users-clean.csv')`. Utilisez le mécanisme de chaînage vu en cours et affichez un message en fin de traitement.

**Résultat attendu :** un fichier `users-clean.csv` contenant uniquement les lignes actives, avec la colonne `country` en majuscules :

```csv
id,name,country,active
1,Alice,FRANCE,true
3,Carla,SPAIN,true
4,David,ITALY,true
```

### Partie 4 — Vérifier l'empreinte mémoire

Générez (programmatiquement ou via un script) un `users.csv` de plusieurs centaines de milliers de lignes, puis relancez votre traitement en observant que la mémoire reste stable.

**Résultat attendu :** le traitement aboutit sur un gros fichier sans erreur `out of memory`, avec une consommation mémoire qui ne croît pas avec la taille du fichier.

## Indices

<details>
<summary>Indice 1 — Découper les chunks en lignes</summary>

Un chunk ne se termine pas forcément sur une fin de ligne. Conservez un buffer d'instance `this.tail` : préfixez chaque chunk reçu avec `this.tail`, découpez sur `\n`, et gardez le dernier élément (potentiellement incomplet) dans `this.tail` pour le prochain chunk.

</details>

<details>
<summary>Indice 2 — Gérer l'en-tête</summary>

Utilisez un drapeau booléen `this.headerSent`. Tant qu'il est `false`, la première ligne rencontrée est l'en-tête : poussez-la telle quelle puis passez le drapeau à `true`.

</details>

<details>
<summary>Indice 3 — Le reliquat final</summary>

La dernière ligne du fichier peut ne pas se terminer par `\n` : elle reste alors dans `this.tail`. Traitez-la dans `_flush(callback)` avant d'appeler `callback()`.

</details>

<details>
<summary>Indice 4 — Mode texte</summary>

Passez `{ encoding: 'utf8' }` au `createReadStream`, ou convertissez systématiquement les chunks avec `chunk.toString()` dans `_transform`.

</details>

## Pour aller plus loin

- Rendez la configuration paramétrable : nom de la colonne à mettre en majuscules et prédicat de filtrage passés au constructeur.
- Gérez les valeurs contenant des virgules échappées par des guillemets (CSV « réel »).
- Comparez votre implémentation manuelle avec une librairie de parsing CSV en streaming et mesurez l'écart de performance.
- Ajoutez un compteur de lignes lues / écrites / filtrées émis en fin de traitement.