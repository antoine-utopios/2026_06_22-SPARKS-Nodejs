import { createServer } from "./app.js";

const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;
const { httpServer } = createServer();

httpServer.listen(PORT, () => {
  console.log(`[exercice] Socket.IO rooms ecoute sur http://localhost:${PORT}`);
});
