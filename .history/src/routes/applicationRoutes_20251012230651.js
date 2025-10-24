import { Router } from 'express';
import { apply, listApplicants } from '../controllers/applicationController.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';

const r = Router();
r.post('/', protect, apply);
r.get('/event/:id', protect, requireRole('admin'), listApplicants);
export default r;
