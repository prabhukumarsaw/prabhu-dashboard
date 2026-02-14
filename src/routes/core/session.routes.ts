import { Router, type Router as ExpressRouter } from 'express';
import { authRequired } from '../../middleware';
import * as sessionController from '../../controllers/core/session.controller';
import { param } from 'express-validator';
import { validate } from '../../lib';

const router: ExpressRouter = Router();

router.use(authRequired);

router.get('/', sessionController.list);
router.delete('/:id', [param('id').isUUID()], validate, sessionController.revoke);
router.post('/revoke-all', sessionController.revokeAll);

export default router;
