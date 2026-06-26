import { parentPort, workerData } from "node:worker_threads";

// Calcul CPU volontairement couteux : bloquant s'il etait execute sur le
// thread principal. Ici il tourne sur un thread separe.
function fibonacci(n) {
  if (n < 2) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

const result = fibonacci(workerData);
parentPort.postMessage(result);
