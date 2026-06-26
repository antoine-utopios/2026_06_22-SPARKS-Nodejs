import express from "express";
import { Readable } from "node:stream";
import { runComputation } from "./compute.js";
import { signPayload, getPublicKeyPem } from "./signer.js";
import { jsonWebStream } from "./stream.js";

// Le payload signe = exactement ce qui est verifiable cote client.
export function buildCanonicalPayload(input, result) {
  return JSON.stringify({ input, result });
}

export function createApp() {
  const app = express();

  app.get("/public-key", (req, res) => {
    res.type("text/plain").send(getPublicKeyPem());
  });

  app.get("/compute", async (req, res) => {
    const input = Number(req.query.input);
    if (!Number.isInteger(input) || input < 0 || input > 45) {
      return res
        .status(400)
        .json({ error: "input doit etre un entier entre 0 et 45" });
    }

    try {
      // Calcul deporte sur un Worker Thread (event loop non bloque).
      const result = await runComputation(input);

      // Signature Ed25519 de la chaine canonique.
      const payload = buildCanonicalPayload(input, result);
      const signature = signPayload(payload);
      const body = { input, result, signature, publicKey: getPublicKeyPem() };

      // Web Streams API -> interop stream Node attendu par Express 4.
      res.type("application/json");
      Readable.fromWeb(jsonWebStream(body)).pipe(res);
    } catch (err) {
      res.status(500).json({ error: "echec du calcul", detail: String(err) });
    }
  });

  return app;
}
