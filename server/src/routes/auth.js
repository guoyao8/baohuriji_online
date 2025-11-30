import express from 'express';
import { register, login, getCurrentUser, updateProfile, changePassword } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', authenticate, (req, res) => {
  res.json({ message: '登出成功' });
});
router.get('/me', authenticate, getCurrentUser);
router.put('/me', authenticate, updateProfile);
router.put('/change-password', authenticate, changePassword);

export default router;
