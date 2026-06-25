# TP 5 — Decoupler une API Express d'un worker via AMQP (solution)

Une API Express recoit des demandes de rapport et les **publie sur un exchange**
RabbitMQ (reponse 202 immediate). Un worker consomme la queue avec accuse de
reception manuel, gestion differenciee des erreurs (requeue / DLQ) et
back-pressure par `prefetch`.

## Topologie

```
+-------------+  POST /rapports                   +-------------------------+
| API Express | --publish("rapports",             | exchange "rapports"      |
| (port 3000) |   "rapport.demande", tache) -----> | direct, durable          |
+-------------+   { persistent:true }             +-----------+-------------+
       ^ 202 Accepted                                         | "rapport.demande"
       |                                                      v
                                               +--------------------------+
                                               | queue "generation"        |
                                               | durable, DLX="dlx"        |
                                               | x-dead-letter-routing-key |
                                               |   = "rapport.echec"        |
                                               +-----------+--------------+
                                                           | consume + ack manuel
                                                           v
                                                     +-----------+
                                                     |  Worker    | prefetch=2
                                                     +-----+-----+
              ack -> retire                                |
              nack(false,true) -> requeue borne (x-death)  |  nack(false,false)
                                                           v
                                               +--------------------------+
                                               | exchange "dlx" -> queue   |
                                               | "generation.dlq"          |
                                               +--------------------------+
```

## Lancement local (Node + RabbitMQ en conteneur)

```bash
docker compose up -d rabbitmq      # ou : podman compose up -d rabbitmq
npm install
npm run start:api                  # terminal 1 : API sur :3000
npm run start:worker               # terminal 2 : worker (prefetch=2, delai 3s)
```

Tout-en-conteneur (API + worker + rabbit) : `docker compose up` (ou `podman compose up`).

## Scenarios (via curl)

```bash
# Nominal
curl -X POST localhost:3000/rapports -H 'Content-Type: application/json' -d '{"titre":"Bilan Q1"}'

# Effet prefetch : envoyer 3 demandes -> "Unacked" plafonne a 2 dans l'UI
curl -X POST localhost:3000/rapports -H 'Content-Type: application/json' -d '{"titre":"R1"}'
curl -X POST localhost:3000/rapports -H 'Content-Type: application/json' -d '{"titre":"R2"}'
curl -X POST localhost:3000/rapports -H 'Content-Type: application/json' -d '{"titre":"R3"}'

# Erreur definitive -> DLQ
curl -X POST localhost:3000/rapports -H 'Content-Type: application/json' -d '{"titre":"KO_DEFINITIF"}'

# Erreur transitoire -> requeue borne (3 tentatives) puis DLQ
curl -X POST localhost:3000/rapports -H 'Content-Type: application/json' -d '{"titre":"KO_RETRY"}'
```

Interface RabbitMQ : http://localhost:15672 (guest / guest).

## Variables d'environnement

| Variable   | Defaut                  |
|------------|-------------------------|
| `AMQP_URL` | `amqp://localhost:5672` |
| `PORT`     | `3000`                  |

## Tests

```bash
npm test
```

Couvre le flux complet : **202 + publication**, **ack** retire le message,
**erreur definitive -> DLQ**, **erreur transitoire -> requeue puis DLQ**, et
**prefetch** borne les messages non acquittes en vol.
