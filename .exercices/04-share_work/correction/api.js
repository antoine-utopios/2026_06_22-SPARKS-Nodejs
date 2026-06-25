const express = require('express');
const crypto = require('node:crypto');
const app = express();

import { ITERATIONS, scoreSynchrone, scoreAsynchroneVersionModulo } from './score.immediate.js';
import { scoreViaWorker } from './score.worker.js';

// Route saine, censée répondre instantanément
app.get('/health', (req, res) => {
  res.json({ status: 'ok', ts: Date.now() });
});

// Route problématique : calcul lourd SYNCHRONE
app.get('/score/bloquant/:dossier', (req, res) => {
  const score = scoreSynchrone(req.params.dossier, ITERATIONS);
  res.json({ dossier: req.params.dossier, score: score });
});

// Route non bloquante via setImmmediate
app.get('/score/non-bloquant/:dossier', (req, res) => {
  const score = scoreAsynchroneVersionModulo(req.params.dossier, ITERATIONS);
  res.json({ dossier: req.params.dossier, score: score });
});

app.get('/score/worker/:dossier', (req, res) => {
  try {
    const score = await scoreViaWorker(req.params.dossier, ITERATIONS);
    res.json({ dossier: req.params.dossier, score: score });
  } catch (error) {
    res.status(500).json({
      error: "Une erreur a eu lieu"
    })
  }
});

app.listen(3000, () => console.log('Service sur http://localhost:3000'));