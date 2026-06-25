import amqp from "amqplib";

export const AMQP_URL = process.env.AMQP_URL || "amqp://localhost:5672";

// Noms de la topologie nominale de l'exercice.
export const EXCHANGE = "commandes"; // direct
export const DLX = "dlx"; // dead-letter exchange (direct)
export const QUEUE = "traitement";
export const DLQ = "traitement.dlq";
export const ROUTING_KEY = "commande.creee";
export const DLQ_ROUTING_KEY = "commande.echec";

/**
 * Declaration idempotente de toute la topologie AMQP, partagee par le worker
 * et les tests. On suppose une connexion/canal deja ouverts.
 *
 *   API --publish("commandes","commande.creee")--> exchange "commandes" (direct)
 *                                                        | binding "commande.creee"
 *                                                        v
 *                                                  queue "traitement"
 *                                                  (x-dead-letter-exchange: dlx,
 *                                                   x-dead-letter-routing-key: commande.echec)
 *                                                        | consume + ack
 *                                                        v
 *                                                     Worker
 *                                          nack(false,false) => dlx => "traitement.dlq"
 */
export async function configurerTopologie(ch) {
  await ch.assertExchange(EXCHANGE, "direct", { durable: true });
  await ch.assertExchange(DLX, "direct", { durable: true });

  await ch.assertQueue(QUEUE, {
    durable: true,
    arguments: {
      "x-dead-letter-exchange": DLX,
      "x-dead-letter-routing-key": DLQ_ROUTING_KEY,
    },
  });
  await ch.bindQueue(QUEUE, EXCHANGE, ROUTING_KEY);

  await ch.assertQueue(DLQ, { durable: true });
  await ch.bindQueue(DLQ, DLX, DLQ_ROUTING_KEY);
}

/** Ouvre une connexion + un canal, configure la topologie, et renvoie le tout. */
export async function connecter(url = AMQP_URL) {
  const conn = await amqp.connect(url);
  const ch = await conn.createChannel();
  await configurerTopologie(ch);
  return { conn, ch };
}

// Permet de (re)creer la topologie en ligne de commande : `npm run topologie`.
if (import.meta.url === `file://${process.argv[1]}`) {
  const { conn } = await connecter();
  console.log("Topologie configuree.");
  await conn.close();
}
