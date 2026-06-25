import { connecter, QUEUE, EXCHANGE, ROUTING_KEY } from "./topologie.js";

const MAX_TENTATIVES = 3;
const ENTETE_TENTATIVES = "x-tentatives";

// Compte les tentatives deja effectuees. ATTENTION : un simple nack(requeue=true)
// ne touche PAS l'en-tete x-death (celui-ci n'est pose que lors d'un
// dead-lettering). Pour borner un requeue, on suit donc un compteur applicatif
// (x-tentatives) qu'on incremente nous-memes a chaque republication. On lit
// aussi x-death en secours (cas d'une boucle via DLX + TTL).
export function nbTentatives(msg) {
  const h = (msg.properties.headers || {});
  if (typeof h[ENTETE_TENTATIVES] === "number") return h[ENTETE_TENTATIVES];
  const death = h["x-death"];
  if (death && death[0]) return death[0].count || 0;
  return 0;
}

// Traitement metier simule. Le contenu du message pilote le scenario :
//   { erreur: "definitive" } -> rejet definitif (DLQ)
//   { erreur: "transitoire" } -> requeue borne puis DLQ
function traiter(commande) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (commande.erreur === "definitive") {
        return reject(
          Object.assign(new Error("commande invalide"), { transitoire: false })
        );
      }
      if (commande.erreur === "transitoire") {
        return reject(
          Object.assign(new Error("service indisponible"), { transitoire: true })
        );
      }
      resolve();
    }, 20);
  });
}

/**
 * Demarre la consommation. prefetch borne le nombre de messages non acquittes
 * en vol (back-pressure). ack apres succes, nack(false,true) pour requeue d'une
 * erreur transitoire (borne), nack(false,false) pour dead-letter.
 */
export async function demarrerWorker({ prefetch = 1, onTraite } = {}) {
  const { conn, ch } = await connecter();
  await ch.prefetch(prefetch);

  const { consumerTag } = await ch.consume(QUEUE, async (msg) => {
    if (!msg) return;
    const commande = JSON.parse(msg.content.toString());
    try {
      await traiter(commande);
      ch.ack(msg);
      onTraite?.({ etat: "ack", commande, msg });
    } catch (err) {
      const tentatives = nbTentatives(msg);
      if (err.transitoire && tentatives < MAX_TENTATIVES) {
        // Requeue borne : on republie le message sur l'exchange avec un compteur
        // de tentatives incremente, puis on ack l'original. Un simple
        // nack(requeue=true) bouclerait sans jamais incrementer le compteur.
        ch.publish(EXCHANGE, ROUTING_KEY, msg.content, {
          persistent: true,
          contentType: msg.properties.contentType,
          headers: { ...msg.properties.headers, [ENTETE_TENTATIVES]: tentatives + 1 },
        });
        ch.ack(msg);
        onTraite?.({ etat: "requeue", commande, msg, err, tentatives: tentatives + 1 });
      } else {
        ch.nack(msg, false, false); // dead-letter : definitif ou trop de tentatives
        onTraite?.({ etat: "dlq", commande, msg, err });
      }
    }
  });

  return {
    conn,
    ch,
    consumerTag,
    async fermer() {
      await ch.cancel(consumerTag).catch(() => {});
      await conn.close().catch(() => {});
    },
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const worker = await demarrerWorker({
    prefetch: 2,
    onTraite: ({ etat, commande }) =>
      console.log(`[${etat}] ${commande.id ?? "?"}`),
  });
  console.log("Worker pret, prefetch=2. Ctrl+C pour arreter.");
  const arret = async () => {
    await worker.fermer();
    process.exit(0);
  };
  process.on("SIGINT", arret);
  process.on("SIGTERM", arret);
}
