// Partie 2 - Service assaini : on convertit/valide l'id et on laisse remonter.
// Plus de try/catch qui avale : ce qui n'est pas gere remonte tel quel.
import { NotFoundError, ValidationError } from "./errors.js";

const articles = [
  { id: 1, title: "Node" },
  { id: 2, title: "Express" },
];

export async function getArticle(rawId) {
  const id = Number(rawId);
  if (!Number.isInteger(id)) {
    throw new ValidationError(`id invalide : ${rawId}`);
  }
  const found = articles.find((a) => a.id === id);
  if (!found) {
    throw new NotFoundError(`Article ${id} introuvable`);
  }
  return found;
}
