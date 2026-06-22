import fs from 'node:fs/promises'

async function recupererUser(id) {
  const r = await fetch(`https://jsonplaceholder.typicode.com/users/${id}`);
  if (!r.ok) throw new Error(`HTTP ${r.status} pour l'id ${id}`);
  return r.json();
}

fs.readFile("entree.json", "utf8")
  .then((contenu) => JSON.parse(contenu).ids)
  .then((ids) => Promise.all(ids.map(recupererUser)))
  .then((users) => fs.writeFile("sortie.json", JSON.stringify(users, null, 2)))
  .then(() => console.log("Terminé"))
  .catch((err) => console.error("Échec du pipeline", err));