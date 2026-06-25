import express from "express";
import crypto from "node:crypto";
import { connecter, EXCHANGE, ROUTING_KEY } from "./topologie.js";

const PORT = process.env.PORT || 3000;

/**
 * Construit l'app Express et la branche sur un canal AMQP deja ouvert.
 * Separe de l'ecoute reseau pour etre testable (supertest non requis : on
 * teste le flux complet API -> worker via la queue).
 */
export function creerApp(ch) {
  const app = express();
  app.use(express.json());

  // L'API publie SUR L'EXCHANGE (jamais directement dans la queue) : elle
  // ignore qui consomme. Reponse 202 immediate, traitement delegue au worker.
  app.post("/rapports", (req, res) => {
    const id = crypto.randomUUID();
    const tache = { id, ...req.body };
    const bufferOk = ch.publish(
      EXCHANGE,
      ROUTING_KEY,
      Buffer.from(JSON.stringify(tache)),
      { persistent: true, contentType: "application/json" }
    );
    res.status(202).json({ statut: "accepte", id, bufferOk });
  });

  app.get("/sante", (_req, res) => res.json({ statut: "ok" }));

  return app;
}

export async function demarrer(url) {
  const { conn, ch } = await connecter(url);
  const app = creerApp(ch);
  const server = app.listen(PORT, () =>
    console.log(`API sur http://localhost:${PORT}`)
  );
  return { conn, ch, server, app };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { conn, server } = await demarrer();
  const arret = async () => {
    server.close();
    await conn.close().catch(() => {});
    process.exit(0);
  };
  process.on("SIGINT", arret);
  process.on("SIGTERM", arret);
}
