// server/src/middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Auth guard: verifies JWT (from cookie or Authorization header)
 * and attaches full user info to req.user: { id, name, email, role }
 */
export async function protect(req, res, next) {
  try {
    // Accept token from cookie OR "Authorization: Bearer <token>"
    let token =
      req.cookies?.token ||
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1]
        : null);

    if (!token) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // If your token only contains { id }, this will fetch the rest.
    // If your token contains more, DB is still source of truth.
    const user = await User.findById(decoded.id).select('name email role');

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };

    return next();
  } catch (err) {
    console.error('[auth] protect error:', err.message);
    return res.status(403).json({ message: 'Invalid token' });
  }
}

/**
 * Role guard: ensures the authenticated user has the required role
 */
export function requireRole(role) {
  return (req, res, next) => {
    if (req.user?.role !== role) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}
