import fs from 'node:fs/promises'

async function recupererUser(id, timeoutMs = 2000) {
  const controller = new AbortController();

  const minuteur = setTimeout(() => controller.abort(), timeoutMs)

  try {

    const r = await fetch(`https://jsonplaceholder.typicode.com/users/${id}`, {
      signal: controller.signal
    });
    
    if (!r.ok) throw new Error(`HTTP ${r.status} pour l'id ${id}`);
    
    return r.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`Timeout (${timeoutMs}ms) pour l'id: ${id}`)
    }
    throw error;
  } finally {
    clearTimeout(minuteur)
  }
}

async function main() {
  try {
    const contenu = await fs.readFile("entrees.json", 'utf-8');
    const { ids } = JSON.parse(contenu);
    const utilisateurs = await Promise.all(ids.map(recupererUser));
    await fs.writeFile("sortie.json", JSON.stringify(utilisateurs, null, 2))
    console.log("Terminé")
  } catch (err) {
    console.error("Échec du pipeline", err)
    process.exitCode = 1;
  }
}