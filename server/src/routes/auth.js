import express from 'express';
import { register, login, getCurrentUser, updateProfile } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', authenticate, (req, res) => {
  res.json({ message: '登出成功' });
});
router.get('/me', authenticate, getCurrentUser);
router.put('/me', authenticate, updateProfile);

export default router;
