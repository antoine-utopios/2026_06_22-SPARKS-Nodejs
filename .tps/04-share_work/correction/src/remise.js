// Logique CPU-bound isolee (calcul de signature de remise), testable unitairement.
import crypto from 'node:crypto';

export const ITERATIONS = 2_000_000;

export function calculerRemise(montant, iterations = ITERATIONS) {
  let h = String(montant);
  for (let i = 0; i < iterations; i++) {
    h = crypto.createHash('sha256').update(h).digest('hex');
  }
  return h.slice(0, 16);
}
