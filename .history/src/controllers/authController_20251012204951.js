import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

export async function signup(req, res) {
  try {
    const user = await User.create(req.body);
    res.status(201).json({ message: 'User created', user: { id: user._id, email: user.email } });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
}

export async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password))) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }
  const token = signToken(user);
  res.cookie('token', token, { httpOnly: true, sameSite: 'Lax' });
  res.json({ token, user: { id: user._id, role: user.role, email: user.email, name: user.name } });
}

export async function me(req, res) {
  const user = await User.findById(req.user.id).select('-password');
  res.json(user);
}
