import { Router } from "express";
import { z } from "zod";
import { login } from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validate.js";
import { asyncHandler } from "../middlewares/erreurs.js";

const schemaLogin = z.object({
  login: z.string().min(1),
  password: z.string().min(1),
});

const router = Router();
router.post("/login", validate(schemaLogin), asyncHandler(login));

export default router;
