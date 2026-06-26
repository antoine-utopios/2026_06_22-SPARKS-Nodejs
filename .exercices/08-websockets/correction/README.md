# Module 8 - Exercice (SOLUTION) : rooms + acknowledgement

Solution de l'exercice : diffusion ciblee par **rooms** (join / leave) et
**acknowledgement** (callback cote serveur renvoye au client emetteur).

## Pile

- Express 4.21.2 + Socket.IO 4.8.1 (meme serveur HTTP).

## Lancement

```bash
npm install
npm start   # http://localhost:3001
```

## Tests

```bash
npm test
```

Les tests demarrent le serveur sur un port libre et verifient avec de vrais clients :

- un client membre de la room A recoit les messages de la room A ;
- un client HORS de la room A ne les recoit PAS (isolation) ;
- l'acknowledgement renvoie bien `{ ok: true, ... }` au client emetteur.

## Events

| Event           | Args (client -> serveur)        | ACK (serveur -> emetteur)           |
| --------------- | ------------------------------- | ----------------------------------- |
| `room:join`     | `room, ack`                     | `{ ok, room, members }`             |
| `room:leave`    | `room, ack`                     | `{ ok, room }`                      |
| `room:message`  | `{ room, text }, ack`           | `{ ok, delivered, room }`           |
| `room:message`  | (serveur -> membres room)       | `{ room, text, from, at }`          |
