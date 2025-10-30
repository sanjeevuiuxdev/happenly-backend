import { Router } from 'express';
import { signup, login, me } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const r = Router();
r.post('/signup', signup);
r.post('/login', login);
r.get('/me', protect, me);
export default r;
