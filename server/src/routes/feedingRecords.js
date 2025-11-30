import express from 'express';
import { createRecord, getRecords, updateRecord, deleteRecord } from '../controllers/feedingController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getRecords);
router.post('/', createRecord);
router.put('/:id', updateRecord);
router.delete('/:id', deleteRecord);

export default router;
