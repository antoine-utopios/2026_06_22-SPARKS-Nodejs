import jwt from 'jsonwebtoken'

export function authenticate(email, password) {
  if (email === 'user@example.com' && password === 'password') {
    return jwt.sign({
      sub: email
    }, process.env.JWT_SECRET)
  } else {
    const error = new Error('Identifiants invalides');
    error.status = 401;
    throw error;
  }
}