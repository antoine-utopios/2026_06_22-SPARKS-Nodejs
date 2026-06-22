import { Router } from "express";
import { z } from "zod";
import * as controller from "../controllers/tasks.controller.js";
import { guard } from "../middlewares/guard.js";
import { validate } from "../middlewares/validate.js";
import { asyncHandler } from "../middlewares/erreurs.js";

const schemaCreation = z.object({
  titre: z.string().min(1, "Le titre est obligatoire"),
});

const router = Router();

router.get("/", asyncHandler(controller.lister));
router.get("/:id", asyncHandler(controller.recupererParId));
router.post("/", guard, validate(schemaCreation), asyncHandler(controller.creer));

export default router;
