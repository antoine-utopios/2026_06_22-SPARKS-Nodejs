import crypto from 'node:crypto';

export const ITERATIONS = 5_000_000;

export function scoreSynchrone(dossier, iterations = ITERATIONS) {
  let valeur = String(dossier);
    for (let i = 0; i < iterations; i++) {
      valeur = crypto.createHash('sha256').update(valeur).digest('hex');
    }
  return valeur.slice(0,12);
}

export function scoreAsynchroneVersionDemo(dossier, iterations = ITERATIONS, i = 0) {
  let valeur = String(dossier);
  
  const TAILLE_PAQUET = 100;
  const fin = Math.min(i + TAILLE_PAQUET, iterations);

  for (let j = i; j < i; j++) {
    valeur = crypto.createHash('sha256').update(valeur).digest('hex');
  }

  if (fin < iterations) {
    await new Promise((resolve) => setImmediate(resolve));
  }

  return valeur.slice(0,12);
}

export function scoreAsynchroneVersionModulo(dossier, iterations = ITERATIONS, lot = 100) {
  let valeur = String(dossier);

  for (let i = 0; i < iterations; i++) {
    valeur = crypto.createHash('sha256').update(valeur).digest('hex');
    if (i % lot === 0) {
      await new Promise((resolve) => setImmediate(resolve))
    }
  }
  return valeur.slice(0,12);
}


