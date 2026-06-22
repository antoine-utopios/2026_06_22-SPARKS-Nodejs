import fs from 'node:fs/promises'

async function recupererUser(id) {
  const r = await fetch(`https://jsonplaceholder.typicode.com/users/${id}`);
  if (!r.ok) throw new Error(`HTTP ${r.status} pour l'id ${id}`);
  return r.json();
}

async function mapWithWorkerPool(elements, limit = 2, task) {
  const results = [];
  let index = 0;

  async function worker() {
    while (index < elements.length) {
      const i = index++;
      results[i] = await task(elements[i]);
    }
  }

  await Promise.all(Array.from({ length: limit }, worker))
  return results;

}

async function main() {
  try {
    const contenu = await fs.readFile("entrees.json", 'utf-8');
    const { ids } = JSON.parse(contenu);
    const utilisateurs = await mapWithWorkerPool(ids, 2, recupererUser)
    await fs.writeFile("sortie.json", JSON.stringify(utilisateurs, null, 2))
    console.log("Terminé")
  } catch (err) {
    console.error("Échec du pipeline", err)
    process.exitCode = 1;
  }
}