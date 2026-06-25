import { createServer, createRedisAdapterFactory } from "./app.js";

const PORT = process.env.PORT ? Number(process.env.PORT) : 3002;
const REDIS_URL = process.env.REDIS_URL; // ex: redis://localhost:6379

// Si REDIS_URL est defini, on active le scaling multi-instances via Redis.
let attachAdapter;
if (REDIS_URL) {
  const factory = createRedisAdapterFactory(REDIS_URL);
  attachAdapter = factory.attach;
  console.log(`[tp] Adaptateur Redis actif (${REDIS_URL})`);
}

const { httpServer } = await createServer({ attachAdapter });

httpServer.listen(PORT, () => {
  console.log(`[tp] Chat Socket.IO (namespace /chat) ecoute sur http://localhost:${PORT}`);
  console.log("[tp] Token de test valide : token-test (auth.token cote client)");
});
