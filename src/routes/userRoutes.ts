import { Router } from 'express';
import { deleteUser, getOwnUserInfo, getUserInfo, getAllUsers } from '../controllers/userController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.get('/me', authenticateJWT, getOwnUserInfo);

router.get('/user/:userId', authenticateJWT, getUserInfo );

router.get('/user', authenticateJWT, getAllUsers);

router.delete('/user/:userId', authenticateJWT, deleteUser);

export default router;