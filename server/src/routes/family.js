import express from 'express';
import {
  getFamilyMembers,
  inviteMember,
  joinFamily,
  updateMember,
  removeMember,
} from '../controllers/familyController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/members', getFamilyMembers);
router.post('/invite', inviteMember);
router.post('/join', joinFamily);
router.put('/members/:id', updateMember);
router.delete('/members/:id', removeMember);

export default router;
