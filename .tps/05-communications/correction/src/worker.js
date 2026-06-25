import { connecter, QUEUE, EXCHANGE, ROUTING_KEY } from "./topologie.js";

const MAX_TENTATIVES = 3;
const ENTETE_TENTATIVES = "x-tentatives";

// Simule la generation d'un rapport (traitement long). Le titre pilote le
// scenario d'erreur pour la demo / les tests.
export function genererRapport(tache, { delai = 50 } = {}) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const titre = tache.titre || "";
      if (titre.includes("KO_DEFINITIF")) {
        return reject(
          Object.assign(new Error("rapport invalide"), { transitoire: false })
        );
      }
      if (titre.includes("KO_RETRY")) {
        return reject(
          Object.assign(new Error("service indisponible"), { transitoire: true })
        );
      }
      resolve();
    }, delai);
  });
}

// Nombre de tentatives deja effectuees. Un nack(requeue=true) ne touche pas
// x-death : on suit donc un compteur applicatif x-tentatives republie a chaque
// retry. On lit x-death en secours (boucle via DLX + TTL).
export function nbTentatives(msg) {
  const h = msg.properties.headers || {};
  if (typeof h[ENTETE_TENTATIVES] === "number") return h[ENTETE_TENTATIVES];
  const death = h["x-death"];
  if (death && death[0]) return death[0].count || 0;
  return 0;
}

/**
 * Demarre le worker. prefetch = back-pressure (messages non-ack en vol bornes).
 * ack apres succes ; nack(false,true) requeue borne pour erreur transitoire ;
 * nack(false,false) dead-letter pour erreur definitive ou trop de tentatives.
 */
export async function demarrerWorker({ prefetch = 2, delai, onTraite } = {}) {
  const { conn, ch } = await connecter();
  await ch.prefetch(prefetch);

  const { consumerTag } = await ch.consume(QUEUE, async (msg) => {
    if (!msg) return;
    const tache = JSON.parse(msg.content.toString());
    try {
      await genererRapport(tache, { delai });
      ch.ack(msg);
      onTraite?.({ etat: "ack", tache });
    } catch (err) {
      const tentatives = nbTentatives(msg);
      if (err.transitoire && tentatives < MAX_TENTATIVES) {
        // Requeue borne : republie avec compteur incremente puis ack l'original.
        ch.publish(EXCHANGE, ROUTING_KEY, msg.content, {
          persistent: true,
          contentType: msg.properties.contentType,
          headers: { ...msg.properties.headers, [ENTETE_TENTATIVES]: tentatives + 1 },
        });
        ch.ack(msg);
        onTraite?.({ etat: "requeue", tache, err, tentatives: tentatives + 1 });
      } else {
        ch.nack(msg, false, false);
        onTraite?.({ etat: "dlq", tache, err });
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
    delai: 3000,
    onTraite: ({ etat, tache }) =>
      console.log(`[${etat}] ${tache.id} (${tache.titre || "sans titre"})`),
  });
  console.log("Worker pret, prefetch=2.");
  const arret = async () => {
    await worker.fermer();
    process.exit(0);
  };
  process.on("SIGINT", arret);
  process.on("SIGTERM", arret);
}
