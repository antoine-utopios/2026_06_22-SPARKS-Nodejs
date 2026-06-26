import { createApp } from "./app.js";
import { installProcessHandlers } from "./processHandlers.js";

const app = createApp();

installProcessHandlers();

const port = process.env.PORT || 3000;
const server = app.listen(port, () =>
  console.log(`API sur http://localhost:${port}`)
);

// Arret propre.
process.on("SIGTERM", () => server.close(() => process.exit(0)));
