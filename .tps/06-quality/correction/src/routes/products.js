import { Router } from "express";
import { NotFoundError, ValidationError } from "../errors.js";

const products = [
  { id: 1, name: "Clavier" },
  { id: 2, name: "Souris" },
];

// Route lente : boucle synchrone qui domine le CPU profile.
// `iterations` (defaut 5e7) permet de garder les tests rapides.
export function buildReport(iterations = 5e7) {
  let acc = 0;
  for (let i = 0; i < iterations; i++) {
    acc += Math.sqrt(i) % 13;
  }
  return { total: products.length, checksum: acc };
}

const router = Router();

router.get("/report", (req, res) => {
  const iterations = req.query.iterations
    ? Number(req.query.iterations)
    : undefined;
  res.json(buildReport(iterations));
});

router.get("/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    throw new ValidationError(`id invalide : ${req.params.id}`);
  }
  const product = products.find((p) => p.id === id); // breakpoint conseille ici
  if (!product) {
    throw new NotFoundError(`Produit ${id} introuvable`);
  }
  res.json(product);
});

export default router;
