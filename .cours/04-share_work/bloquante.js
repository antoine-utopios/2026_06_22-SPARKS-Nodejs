function tacheLongue(elements) {
  const results = [];
  for (const id of elements) {
    // Traitement lourd... qui prend 10s
    const result = traitementLong(id);
    results.push(result); 
  }

  return results;
}