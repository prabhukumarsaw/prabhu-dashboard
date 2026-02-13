import { Router, type Router as ExpressRouter } from 'express';
import { authRequired } from '../middleware';
import { createSSEHandler } from '../services/realtime.service';

const router: ExpressRouter = Router();

router.use(authRequired);

// Server-Sent Events endpoint
router.get('/sse', createSSEHandler());

export default router;
