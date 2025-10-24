import Application from '../models/Application.js';

export async function apply(req, res) {
  try {
    const doc = await Application.create({ user: req.user.id, event: req.body.eventId });
    res.status(201).json(doc);
  } catch (e) {
    res.status(400).json({ message: e.code === 11000 ? 'Already applied' : e.message });
  }
}

export async function listApplicants(req, res) {
  const { id } = req.params; // event id
  const items = await Application.find({ event: id }).populate('user', 'name email');
  res.json(items);
}
