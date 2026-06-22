import "dotenv/config";
import { creerApp } from "./app.js";

const port = process.env.PORT || 3000;
creerApp().listen(port, () => {
  console.log(`API demarree sur http://localhost:${port}`);
});
