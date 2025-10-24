import { Router } from 'express';
import { apply, listApplicants, listAllApplications, applicationStats } from '../controllers/applicationController.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';

const r = Router();
r.post('/', protect, apply);
r.get('/event/:id', protect, requireRole('admin'), listApplicants);

// NEW admin endpoints
r.get('/', protect, requireRole('admin'), listAllApplications);     
r.get('/stats', protect, requireRole('admin'), applicationStats);

export default r;
