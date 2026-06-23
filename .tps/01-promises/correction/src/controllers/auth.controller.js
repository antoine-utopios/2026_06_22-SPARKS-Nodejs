import { authentifier } from "../services/auth.service.js";

export function login(req, res) {
  const { login, password } = req.body;
  const token = authentifier(login, password);
  res.json({ token });
}
