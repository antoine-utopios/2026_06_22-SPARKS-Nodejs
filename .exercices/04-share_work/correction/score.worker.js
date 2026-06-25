import { Worker } from "node:worker_threads"

export function scoreViaWorker(dossier, iterations = 5_000_000) {
  return new Promise((resolve, reject) => {
    const worker = new Worker('worker.js', { workerData: { dossier, iterations }})

    worker.once('message', resolve)
    worker.once('error', reject)
    worker.once('exit', (code) => {
      if (code !== 0) reject(new Error("Quelque chose s'est passé dans le worker. Code de sortie: " + code));
    })
  })
}