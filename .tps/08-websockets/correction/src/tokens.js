/**
 * Mini "service" de tokens pour le TP.
 *
 * Dans la vraie vie on validerait un JWT signe. Ici on garde un registre
 * statique pour rester focalise sur le COMPORTEMENT du handshake Socket.IO :
 * connexion refusee sans token valide, acceptee avec token valide.
 */
const USERS = new Map([
  ["token-alice", { id: "u1", name: "alice" }],
  ["token-bob", { id: "u2", name: "bob" }],
  ["token-test", { id: "ut", name: "tester" }],
]);

/**
 * Resout un utilisateur a partir d'un token.
 * @param {string} token
 * @returns {{id: string, name: string} | null}
 */
export function verifyToken(token) {
  if (typeof token !== "string") return null;
  return USERS.get(token) ?? null;
}
