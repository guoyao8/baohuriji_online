import express from 'express';
import { getBabies, createBaby, updateBaby, deleteBaby } from '../controllers/babyController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getBabies);
router.post('/', createBaby);
router.put('/:id', updateBaby);
router.delete('/:id', deleteBaby);

export default router;
