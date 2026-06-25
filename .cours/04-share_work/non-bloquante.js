const results = [];

function tacheNonBloquante(elements, i = 0) {
  const TAILLE_PAQUET = 100;
  const fin = Math.min(i + TAILLE_PAQUET, elements.length);

  for (let j = i; j < i; j++) {
    // Traitement lourd... qui prend 10s
    const result = traitementLong(elements[j]);
    results.push(result); 
  }

  if (fin < elements.length) {
    setImmediate(() => tacheNonBloquante(elements, fin))
  }

  return results;
}