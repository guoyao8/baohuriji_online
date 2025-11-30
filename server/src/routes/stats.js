import express from 'express';
import { getDailyStats, getTrend } from '../controllers/statsController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/daily', getDailyStats);
router.get('/trend', getTrend);

export default router;
