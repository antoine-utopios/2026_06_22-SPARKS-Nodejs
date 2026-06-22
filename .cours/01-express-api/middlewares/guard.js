import jwt from 'jsonwebtoken'

export function authGuard(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({
      message: 'Pas de token!'
    });
  }

  try {
    req.user = jwt.verify(header.slice(7), process.env.JWT_SECRET)
    next()
  } catch {
    res.status(401).json({
      message: 'Token invalide ou expiré !'
    })
  }
}