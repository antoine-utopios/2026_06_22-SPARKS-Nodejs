import { Worker } from "node:worker_threads";

// Deporte le calcul sur un Worker Thread. Le thread principal reste libre :
// plusieurs appels concurrents tournent sur des threads distincts.
export function runComputation(input) {
  return new Promise((resolve, reject) => {
    // URL absolue : indispensable avec les modules ES.
    const worker = new Worker(new URL("./worker.js", import.meta.url), {
      workerData: input,
    });
    worker.on("message", resolve);
    worker.on("error", reject);
    worker.on("exit", (code) => {
      if (code !== 0) reject(new Error(`worker arrete, code ${code}`));
    });
  });
}
