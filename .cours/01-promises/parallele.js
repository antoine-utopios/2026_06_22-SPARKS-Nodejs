import { recuperationUtilisateur } from "./lib";


// Si l'on veut avoir tous les résultats. Au moindre soucis parmi les appels, on aura une erreur. En gros, on a soit tout, soit rien.
async function enParalleleBloquant(listeIds, delaisMs = 100) {
  return Promise.all(listeIds.map((id) => recuperationUtilisateur(id, delaisMs)))
}

// Si l'on veut avoir tous les résultats qui sont passés. En cas de soucis, certaines promesses auront un statut 'rejected' ainsi qu'une raison.
async function enParalleleNonBloquant(listeIds, delaisMs = 100) {
  return Promise.allSettled(listeIds.map((id) => recuperationUtilisateur(id, delaisMs)))
}