export const validate = (schema) => (req, res, next) => {
  const resultat = schema.safeParse(req.body);
  if (!resultat.success) {
    return res.status(400).json({
      error: "Donnees invalides",
      details: resultat.error.issues.map((i) => i.message),
    });
  }
  req.body = resultat.data;
  next();
};
