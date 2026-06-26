// Middleware d'erreur centralise. Signature a 4 args obligatoire pour
// qu'Express le reconnaisse comme handler d'erreur.
export function errorHandler(err, req, res, next) {
  const status = err.statusCode || 500;
  if (!err.isOperational) console.error("Erreur programmeur :", err);
  res.status(status).json({
    error: err.isOperational ? err.message : "Erreur interne",
  });
}
