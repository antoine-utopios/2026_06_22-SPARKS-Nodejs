import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";

// Instance UNIQUE partagee par toute l'application : condition necessaire
// pour que getStore() retrouve le bon contexte depuis n'importe quel import.
export const als = new AsyncLocalStorage();

// Logger par defaut (stdout). Injectable -> remplacable par un spy en test.
export const defaultLogger = {
  log: (entry) => console.log(JSON.stringify(entry)),
};

// Middleware : ouvre un store par requete et appelle next() DANS run(),
// pour que toute la chaine asynchrone qui en decoule herite du store.
export function contextMiddleware(req, res, next) {
  const store = new Map();
  store.set("requestId", req.headers["x-request-id"] ?? randomUUID());
  als.run(store, () => next());
}

// Acces au requestId courant depuis n'importe quelle profondeur, sans parametre.
export function getRequestId() {
  return als.getStore()?.get("requestId");
}

// Log contextuel : aucun identifiant recu en argument.
export function log(message, logger = defaultLogger) {
  logger.log({ requestId: getRequestId(), message });
}
