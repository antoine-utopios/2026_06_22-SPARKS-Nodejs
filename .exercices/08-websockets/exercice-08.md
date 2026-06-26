# Exercice 8 — Rooms et acknowledgements avec Socket.IO

> Module 8 · Durée : 45 min · Difficulté : 3/5 · Type : Exercice d'application

## Objectifs pédagogiques

- Utiliser les rooms Socket.IO pour rejoindre et quitter dynamiquement un canal logique
- Diffuser un message uniquement aux membres d'une room donnée
- Implémenter un acknowledgement pour confirmer la réception d'un message à l'émetteur

## Prérequis

- Node.js 20+ installé
- Avoir suivi la section 2 du Module 8 (événements, broadcast, rooms, acks)
- Connaissances de base d'Express et des modules ES
- Code de référence disponible dans `code/module-08/exercice/`

## Contexte

Vous partez d'un serveur Socket.IO minimal greffé sur Express qui diffuse aujourd'hui chaque message à tous les clients connectés. L'équipe veut introduire la notion de salons (rooms) : un utilisateur doit pouvoir rejoindre un salon nommé, n'y recevoir que les messages de ce salon, et le quitter. De plus, l'expéditeur doit recevoir une confirmation que son message a bien été pris en charge par le serveur.

## Énoncé

### Partie 1 — Rejoindre et quitter une room

Dans le serveur Socket.IO :

1. Ajoutez un gestionnaire pour l'événement `joinRoom` qui reçoit un nom de room. Le socket doit rejoindre cette room avec `socket.join(room)`.
2. Quand un socket rejoint une room, prévenez les autres membres déjà présents (et eux seuls) via un événement `roomNotice` indiquant qu'un nouvel arrivant est là.
3. Ajoutez un gestionnaire `leaveRoom` qui fait quitter la room au socket (`socket.leave(room)`) et notifie les membres restants.

**Résultat attendu :** en ouvrant deux clients et en faisant rejoindre la room `dev` aux deux, le second à rejoindre déclenche un `roomNotice` reçu uniquement par le premier. Un client dans une autre room ne reçoit rien.

### Partie 2 — Message ciblé avec acknowledgement

1. Ajoutez un gestionnaire pour l'événement `roomMessage` qui reçoit un objet `{ room, text }` et un callback d'acknowledgement.
2. Diffusez le message à tous les membres de la room concernée (émetteur inclus) via un événement `roomMessage`.
3. Appelez le callback d'acknowledgement avec un objet `{ status: "ok", deliveredAt: <timestamp> }` pour confirmer la prise en charge.
4. Côté client, fournissez ce callback lors de l'`emit` et affichez la confirmation reçue.

**Résultat attendu :** un message envoyé dans la room `dev` n'apparaît que chez les membres de `dev`. L'émetteur voit dans sa console le `status: "ok"` retourné par le serveur.

## Indices

<details>
<summary>Indice 1 — Diffuser aux membres d'une room</summary>

`socket.to(room).emit(...)` envoie à tous les membres de la room SAUF l'émetteur. `io.to(room).emit(...)` envoie à TOUS les membres, émetteur inclus. Choisissez selon que l'expéditeur doit ou non voir son propre message.

</details>

<details>
<summary>Indice 2 — Recevoir le callback d'ack côté serveur</summary>

Le callback d'acknowledgement est passé comme dernier argument du handler :

```js
socket.on("roomMessage", (data, ack) => {
  // ... traitement ...
  ack({ status: "ok", deliveredAt: Date.now() });
});
```

`ack` n'est défini que si le client a fourni un callback à l'emit.

</details>

<details>
<summary>Indice 3 — Fournir le callback côté client</summary>

Le callback est le dernier argument de `emit` :

```js
socket.emit("roomMessage", { room, text }, (response) => {
  console.log("Confirmé:", response.status, response.deliveredAt);
});
```

</details>

## Pour aller plus loin

- Empêchez un client d'envoyer dans une room qu'il n'a pas rejointe (vérifiez `socket.rooms.has(room)` avant de diffuser, sinon renvoyez `{ status: "error" }` dans l'ack).
- Ajoutez le suivi du nombre de membres par room et diffusez ce compteur à chaque join/leave (`io.of("/").adapter.rooms` ou un compteur maintenu manuellement).
- Transformez l'ack en promesse côté client avec un délai d'expiration grâce à `socket.timeout(2000).emit(...)`.