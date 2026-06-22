import jwt from "jsonwebtoken";

// Utilisateur de test ; en production, verifier en base avec mot de passe hache.
const UTILISATEUR_DEMO = { id: 1, login: "demo", password: "demo" };

export function authentifier(login, password) {
  if (
    login !== UTILISATEUR_DEMO.login ||
    password !== UTILISATEUR_DEMO.password
  ) {
    const err = new Error("Identifiants invalides");
    err.status = 401;
    throw err;
  }
  return jwt.sign({ sub: UTILISATEUR_DEMO.id, login }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
}
