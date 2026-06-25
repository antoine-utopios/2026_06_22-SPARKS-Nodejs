import { workerData, parentPort } from "node:worker_threads";
import { scoreSynchrone } from "./score.immediate.js";

const { dossier, iterations } = workerData;
parentPort.postMessage(scoreSynchrone(dossier, iterations))