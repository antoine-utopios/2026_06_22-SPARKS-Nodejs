import { authenticate } from "../services/authService";

export function login (req, res) {
  const { email, password } = req.body;

  const jwt = authenticate(email, password)

  res.status(200).json({
    jwt
  })
}