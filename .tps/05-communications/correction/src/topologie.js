import amqp from "amqplib";

export const AMQP_URL = process.env.AMQP_URL || "amqp://localhost:5672";

export const EXCHANGE = "rapports"; // direct
export const DLX = "dlx"; // dead-letter exchange
export const QUEUE = "generation";
export const DLQ = "generation.dlq";
export const ROUTING_KEY = "rapport.demande";
export const DLQ_ROUTING_KEY = "rapport.echec";

/**
 * Topologie idempotente partagee par l'API et le worker.
 *
 *   API --publish("rapports","rapport.demande")--> exchange "rapports" (direct)
 *                                                       | binding "rapport.demande"
 *                                                       v
 *                                                 queue "generation"
 *                                                 (DLX -> "dlx" / "rapport.echec")
 *                                                       v consume + ack
 *                                                     Worker
 *                                  nack(false,false) => dlx => "generation.dlq"
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

export async function connecter(url = AMQP_URL) {
  const conn = await amqp.connect(url);
  const ch = await conn.createChannel();
  await configurerTopologie(ch);
  return { conn, ch };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { conn } = await connecter();
  console.log("Topologie configuree.");
  await conn.close();
}
