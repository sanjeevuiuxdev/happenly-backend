import { Router } from 'express';
import { listEvents, getEvent, createEvent, updateEvent, removeEvent } from '../controllers/eventController.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';

const r = Router();
r.get('/', listEvents);
r.get('/:id', getEvent);
r.post('/', protect, requireRole('admin'), createEvent);
r.patch('/:id', protect, requireRole('admin'), updateEvent);
r.delete('/:id', protect, requireRole('admin'), removeEvent);
export default r;
