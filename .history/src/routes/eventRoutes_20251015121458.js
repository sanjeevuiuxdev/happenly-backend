import { Router } from 'express';
import { protect, requireRole } from '../middleware/authMiddleware.js';
import {
  createEvent,
  updateEvent,
  deleteEvent,
  getAllEvents,
  getEventById,
} from '../controllers/eventController.js';

const r = Router();

// public or user routes
r.get('/', getAllEvents);
r.get('/:id', getEventById);

// admin routes
r.post('/', protect, requireRole('admin'), createEvent);
r.put('/:id', protect, requireRole('admin'), updateEvent);
r.delete('/:id', protect, requireRole('admin'), deleteEvent);

export default r;
