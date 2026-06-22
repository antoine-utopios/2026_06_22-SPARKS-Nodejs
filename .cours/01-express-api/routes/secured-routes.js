import { Router } from "express";
import { helloCustomController } from '../controllers/helloCustomController';
import { helloBasicController } from '../controllers/helloBasicController';

const router = Router();

router.get('/', helloBasicController)
router.post('/custom', helloCustomController)

export default router;