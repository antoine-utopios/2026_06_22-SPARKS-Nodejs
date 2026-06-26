// Partie 3 - Middleware d'erreur centralise (signature a 4 args).
// A enregistrer APRES toutes les routes.
export function errorHandler(err, req, res, next) {
  const status = err.statusCode || 500;
  if (!err.isOperational) {
    // Erreur programmeur : trace complete cote serveur, masquee cote client.
    console.error("Erreur programmeur :", err);
  }
  res.status(status).json({
    error: err.isOperational ? err.message : "Erreur interne",
  });
}
