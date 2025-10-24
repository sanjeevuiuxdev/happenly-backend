import Event from '../models/Event.js';
import cloudinary from '../config/cloudinary.js';

export async function listEvents(req, res) {
  const { q, department, type, from, to, sort = 'startAt', order = 'asc', page = 1, limit = 10 } = req.query;
  const where = {};
  if (q) where.$text = { $search: q };
  if (department) where.department = department;
  if (type) where.type = type;
  if (from || to) where.startAt = { ...(from && { $gte: new Date(from) }), ...(to && { $lte: new Date(to) }) };

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Event.find(where).sort({ [sort]: order === 'desc' ? -1 : 1 }).skip(skip).limit(Number(limit)),
    Event.countDocuments(where),
  ]);

  res.json({ items, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
}

export async function getEvent(req, res) {
  const doc = await Event.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json(doc);
}

export async function createEvent(req, res) {
  const payload = { ...req.body, createdBy: req.user.id };
  const doc = await Event.create(payload);
  res.status(201).json(doc);
}

export async function updateEvent(req, res) {
  const doc = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json(doc);
}

export async function removeEvent(req, res) {
  await Event.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
}
