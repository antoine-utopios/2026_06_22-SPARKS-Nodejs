# Module 8 - TP (SOLUTION) : chat complet + scaling Redis

Chat Socket.IO complet :

- **Namespace** applicatif `/chat`
- **AUTH du handshake** par token (middleware `io.use`) : connexion refusee
  sans token valide, acceptee avec token
- **Rooms** : join / leave + diffusion ciblee
- **Events types** : contrat d'evenements clair avec acknowledgements
- **Scaling multi-instances** via `@socket.io/redis-adapter` (Redis Pub/Sub)

## Pile

- Express 4.21.2, Socket.IO 4.8.1
- @socket.io/redis-adapter 8.3.0, ioredis 5.4.1

## Lancement (mono-instance)

```bash
npm install
npm start                         # http://localhost:3002 (sans Redis)
REDIS_URL=redis://localhost:6379 npm start   # avec scaling Redis
```

Token de test valide cote client : `token-test`
(autres : `token-alice`, `token-bob`).

## Tests

```bash
npm test
```

- `test/auth-rooms.test.js` : auth handshake (refus / acceptation), namespace,
  rooms, events types. Ne necessite PAS Redis.
- `test/redis-scaling.test.js` : prouve le relais inter-instances via Redis.
  Ce test est **ignore** si `REDIS_URL` n'est pas defini, et execute sinon.

### Tester le scaling avec Redis (Podman)

```bash
podman network create nodeadv-m8 || true
podman run -d --rm --name m8-redis --network nodeadv-m8 docker.io/library/redis:7-alpine
# attendre PONG :
podman exec m8-redis redis-cli ping

# stager le projet hors volume reseau puis :
podman run --rm --network nodeadv-m8 -e REDIS_URL=redis://m8-redis:6379 \
  -v "$STAGE":/app:Z -w /app docker.io/library/node:20-alpine \
  sh -c "npm install --no-audit --no-fund --loglevel=error && npm test"

# nettoyage :
podman rm -f m8-redis
podman network rm nodeadv-m8
```

## Scaling en production (docker-compose)

Deux instances `app1`/`app2` derriere le meme Redis :

```bash
docker compose up --build
```

Un client connecte a `app1` (3002) recoit les messages emis depuis `app2` (3003),
car le broadcast transite par Redis Pub/Sub.

## Events (contrat type)

| Event          | Args (client -> /chat)     | ACK / diffusion                       |
| -------------- | -------------------------- | ------------------------------------- |
| `room:join`    | `{ room }, ack`            | ACK `{ ok, room, user }`              |
| `room:leave`   | `{ room }, ack`            | ACK `{ ok, room }`                    |
| `chat:send`    | `{ room, text }, ack`      | ACK `{ ok, delivered, room }`         |
| `chat:message` | (serveur -> membres room)  | `{ room, text, from, at }`            |

Handshake : `auth: { token }` cote client (`io("/chat", { auth: { token } })`).
