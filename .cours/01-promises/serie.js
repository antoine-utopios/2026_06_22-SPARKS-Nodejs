import { recuperationUtilisateur } from "./lib";

async function enSerie(listeIds, delaisMs = 100) {
  const results = [];
  for (const id of listeIds) {
    results.push(await recuperationUtilisateur(id, delaisMs))
  }

  return results;
}