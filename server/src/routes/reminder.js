import express from 'express';
import { getReminderSettings, saveReminderSettings } from '../controllers/reminderController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getReminderSettings);
router.post('/', saveReminderSettings);

export default router;
