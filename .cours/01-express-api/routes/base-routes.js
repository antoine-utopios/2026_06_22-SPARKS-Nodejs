import { Router } from "express";
import { helloCustomController } from '../controllers/helloCustomController';
import { helloBasicController } from '../controllers/helloBasicController';
import { login } from "../controllers/authController";

const router = Router();

router.get('/', helloBasicController)
router.post('/custom', helloCustomController)
router.post('/auth', login)

export default router;