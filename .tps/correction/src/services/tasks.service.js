let taches = [];
let sequence = 0;

export function lister() {
  return taches;
}

export function creer({ titre }) {
  const tache = { id: ++sequence, titre, faite: false };
  taches.push(tache);
  return tache;
}

export function recupererParId(id) {
  const tache = taches.find((t) => t.id === Number(id));
  if (!tache) {
    const err = new Error(`Tache ${id} introuvable`);
    err.status = 404;
    throw err;
  }
  return tache;
}

// Utilitaire pour les tests : remet l'etat a zero.
export function reinitialiser() {
  taches = [];
  sequence = 0;
}
