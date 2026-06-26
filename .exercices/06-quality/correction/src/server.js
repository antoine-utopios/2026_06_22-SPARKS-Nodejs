import { createApp } from "./app.js";

const app = createApp();
const port = process.env.PORT || 3000;

const server = app.listen(port, () =>
  console.log(`http://localhost:${port}`)
);

process.on("SIGTERM", () => server.close(() => process.exit(0)));
