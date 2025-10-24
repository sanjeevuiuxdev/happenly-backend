import Application from '../models/Application.js';
import Event from '../models/Event.js';

// ... existing exports (apply, listApplicants) stay as-is

export async function listAllApplications(req, res) {
  const { eventId, status, page = 1, limit = 25 } = req.query;
  const where = {};
  if (eventId) where.event = eventId;
  if (status) where.status = status;

  const skip = (Number(page) - 1) * Number(limit);

  // populate user & event for admin view
  const q = Application.find(where)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .populate('user', 'name email')
    .populate('event', 'title startAt');

  const [items, total] = await Promise.all([q, Application.countDocuments(where)]);
  res.json({ items, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
}

export async function applicationStats(req, res) {
  // count applications per event
  const grouped = await Application.aggregate([
    { $group: { _id: '$event', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  const ids = grouped.map(g => g._id);
  const events = await Event.find({ _id: { $in: ids } }, { title: 1, startAt: 1 });
  const eventMap = Object.fromEntries(events.map(e => [e._id.toString(), e]));
  const stats = grouped.map(g => ({
    eventId: g._id,
    title: eventMap[g._id.toString()]?.title || 'Unknown Event',
    startAt: eventMap[g._id.toString()]?.startAt || null,
    applications: g.count
  }));
  res.json({ stats });
}
