import { workerData, parentPort } from 'node:worker_threads'

const resultat = calculTresLourd(workerData);
parentPort.postMessage(resultat);   