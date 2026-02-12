import { Router } from 'express';
import { authRequired } from '../middleware';
import * as sessionController from '../controllers/session.controller';
import { param } from 'express-validator';
import { validate } from '../lib';

const router = Router();

router.use(authRequired);

router.get('/', sessionController.list);
router.delete('/:id', [param('id').isUUID()], validate, sessionController.revoke);
router.post('/revoke-all', sessionController.revokeAll);

export default router;
