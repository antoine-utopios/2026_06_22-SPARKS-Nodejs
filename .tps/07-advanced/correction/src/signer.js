import { generateKeyPairSync, sign, verify } from "node:crypto";

// Paire de cles Ed25519 generee une fois au demarrage du module.
const { privateKey, publicKey } = generateKeyPairSync("ed25519");

// Ed25519 : sign(null, ...) -> pas d'algorithme de hachage a preciser.
export function signPayload(payload) {
  const data = Buffer.from(payload, "utf8");
  return sign(null, data, privateKey).toString("base64");
}

export function verifyPayload(payload, signatureB64) {
  const data = Buffer.from(payload, "utf8");
  return verify(null, data, publicKey, Buffer.from(signatureB64, "base64"));
}

export function getPublicKeyPem() {
  return publicKey.export({ type: "spki", format: "pem" });
}
