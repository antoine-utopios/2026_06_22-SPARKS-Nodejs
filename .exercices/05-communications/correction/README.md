# Exercice 5 — Worker AMQP avec acquittement (solution)

Worker qui consomme une queue RabbitMQ avec accuse de reception manuel,
dead-letter queue (DLQ), distinction erreur transitoire / definitive et
back-pressure par `prefetch`.

## Topologie

```
+-----------+  publish("commandes",        +------------------------+
|  API /    |  "commande.creee", msg)      |  exchange "commandes"   |
|  test     | ---------------------------> |  type: direct, durable  |
+-----------+                              +-----------+-------------+
                                                       | binding key
                                                       | "commande.creee"
                                                       v
                                           +------------------------+
                                           |  queue "traitement"     |
                                           |  durable                |
                                           |  x-dead-letter-exchange |
                                           |    = "dlx"               |
                                           |  x-dead-letter-routing-key
                                           |    = "commande.echec"    |
                                           +-----------+-------------+
                                                       | consume + ack manuel
                                                       v
                                                 +-----------+
                                                 |  Worker   |
                                                 +-----+-----+
                                                       |
              ack (succes)                             |  nack(false,false)  / requeue transitoire borne
              -> message retire                        v  nack(false,true)
                                           +------------------------+
                                           |  exchange "dlx" (direct)|
                                           +-----------+-------------+
                                                       | "commande.echec"
                                                       v
                                           +------------------------+
                                           |  queue "traitement.dlq" |
                                           +------------------------+
```

## Garanties

| Mecanisme            | Choix                                  | Effet |
|----------------------|----------------------------------------|-------|
| Durabilite exchange  | `durable: true`                        | Survit au redemarrage du broker |
| Durabilite queue     | `durable: true`                        | La queue et sa structure persistent |
| Persistance message  | `persistent: true` a la publication    | Ecrit sur disque |
| Acquittement         | Manuel, `ack` apres traitement reussi  | Livraison "au moins une fois" |
| Prefetch             | `prefetch(N)`                          | Borne les messages non-ack en vol (back-pressure) |
| Erreur transitoire   | Republication avec en-tete `x-tentatives` incremente, borne | Requeue puis DLQ apres N tentatives |
| Erreur definitive    | `nack(msg,false,false)`                | Dead-letter immediat via `dlx` |

> Note importante : un simple `nack(msg,false,true)` (requeue) ne touche PAS
> l'en-tete `x-death` (celui-ci n'est pose que lors d'un dead-lettering). Pour
> borner un retry de maniere fiable, le worker republie le message avec un
> compteur applicatif `x-tentatives` incremente, puis acquitte l'original, et
> bascule en DLQ une fois le seuil atteint.

## Lancement local

```bash
docker compose up -d        # ou : podman compose up -d
npm install
npm run topologie           # (optionnel) cree exchanges/queues
npm start                   # demarre le worker (prefetch=2)
```

Interface RabbitMQ : http://localhost:15672 (guest / guest).

## Variables d'environnement

| Variable   | Defaut                  |
|------------|-------------------------|
| `AMQP_URL` | `amqp://localhost:5672` |

## Tests

```bash
npm test
```

Couvre : **ack** retire le message de la queue, **nack(false,false)** route vers
la DLQ (avec en-tete `x-death`), **erreur transitoire** requeue puis DLQ, et
**prefetch** limite le nombre de messages non acquittes en vol.
