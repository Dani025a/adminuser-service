import { Router } from 'express';
import { refreshAccessToken, deactivateSessionsById } from '../controllers/tokenController';

const router = Router();

router.post('/refresh-token', refreshAccessToken);
router.post('/deactivate-session', deactivateSessionsById);

export default router;
