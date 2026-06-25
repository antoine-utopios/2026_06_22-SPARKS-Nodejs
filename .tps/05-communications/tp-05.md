# Exercice 5 — Concevoir le schéma d'échanges d'un worker AMQP

> Module 5 / Gestion avancée des flux Node.js — Difficulté 3/5

## Objectifs

- Concevoir une topologie AMQP complète pour un traitement asynchrone de commandes
- Justifier les choix de durabilité, d'acquittement et de prefetch
- Anticiper la gestion des échecs avec une dead-letter queue

## Prérequis

- Avoir compris le modèle AMQP (exchange, queue, binding, routing key)
- Connaître les mécanismes ack/nack et prefetch vus en cours
- Aucune installation requise : cet exercice est une conception sur papier ou outil de schéma

## Contexte

Une plateforme de e-commerce reçoit des commandes via une API Express. Le traitement d'une commande (vérification de stock, paiement, génération de facture) prend plusieurs secondes et ne doit pas bloquer la réponse HTTP. Vous êtes chargé de concevoir le schéma d'échanges AMQP qui permettra à un (ou plusieurs) worker de traiter ces commandes de manière asynchrone et fiable.

## Énoncé

### Partie 1 — Topologie nominale

Décrivez les éléments AMQP nécessaires au flux normal :

- Le type d'exchange retenu et son nom
- La (ou les) queue(s) et leur(s) binding(s)
- La routing key utilisée pour publier une nouvelle commande

**Résultat attendu :** un schéma (ASCII, diagramme ou liste structurée) montrant le chemin d'un message depuis l'API jusqu'au worker, avec le type d'exchange et la routing key annotés.

### Partie 2 — Fiabilité et back-pressure

Pour chaque point ci-dessous, indiquez votre choix et justifiez-le en une ou deux phrases :

- Durabilité de l'exchange et de la queue
- Persistance des messages
- Mode d'acquittement (manuel ou automatique) et moment du `ack`
- Valeur de `prefetch` choisie et son effet sur la back-pressure

**Résultat attendu :** un tableau à trois colonnes (Paramètre / Choix / Justification).

### Partie 3 — Gestion des échecs

Complétez votre schéma avec la gestion des commandes en erreur :

- Un exchange et une queue de dead-letter
- Les arguments à poser sur la queue de traitement (`x-dead-letter-exchange`, etc.)
- La distinction entre une erreur transitoire (à rejouer) et une erreur définitive (à mettre en DLQ)

**Résultat attendu :** le schéma de la partie 1 enrichi du chemin de dead-lettering, et une courte note expliquant quand utiliser `nack` avec requeue vs sans requeue.

## Indices

<details>
<summary>Indice 1 — Quel type d'exchange ?</summary>

Pour un seul type d'événement (« commande créée ») routé vers une queue de traitement, un exchange `direct` avec une routing key fixe suffit. Réservez `topic` si vous prévoyez plusieurs catégories d'événements (`commande.creee`, `commande.annulee`, etc.).
</details>

<details>
<summary>Indice 2 — Quand acquitter ?</summary>

Le `ack` doit intervenir **après** la fin du traitement réussi, jamais à la réception. Sinon un crash du worker entre la réception et la fin du traitement ferait perdre la commande. C'est le principe « au moins une fois ».
</details>

<details>
<summary>Indice 3 — Erreur transitoire vs définitive</summary>

Une erreur transitoire (service de paiement momentanément indisponible) justifie un `nack(msg, false, true)` pour requeue, idéalement avec un compteur de tentatives. Une erreur définitive (commande invalide) justifie un `nack(msg, false, false)` qui envoie le message en DLQ.
</details>

## Pour aller plus loin

- Comment éviter une boucle infinie de requeue sur une erreur transitoire persistante ? Étudiez le pattern de retry avec délai (queue intermédiaire avec TTL).
- Comment garantir l'idempotence du traitement si un message est livré deux fois ?
- Dessinez la variante avec un exchange `topic` permettant à plusieurs workers spécialisés de s'abonner à des sous-ensembles de commandes.