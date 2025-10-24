import Application from '../models/Application.js';
import Event from '../models/Event.js';

// --- USER APPLY FOR EVENT ---
export async function apply(req, res) {
  try {
    const { eventId } = req.body;
    const existing = await Application.findOne({ event: eventId, user: req.user._id });
    if (existing) return res.status(400).json({ message: 'Already applied to this event' });

    const app = await Application.create({
      event: eventId,
      user: req.user._id,
      status: 'applied',
    });
    res.status(201).json(app);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while applying' });
  }
}

// --- ADMIN: SEE APPLICANTS FOR SPECIFIC EVENT ---
export async function listApplicants(req, res) {
  try {
    const apps = await Application.find({ event: req.params.id })
      .populate('user', 'name email')
      .populate('event', 'title startAt');
    res.json(apps);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching applicants' });
  }
}

// --- ADMIN: SEE ALL APPLICATIONS ---
export async function listAllApplications(req, res) {
  try {
    const { eventId, status, page = 1, limit = 25 } = req.query;
    const where = {};
    if (eventId) where.event = eventId;
    if (status) where.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const q = Application.find(where)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('user', 'name email')
      .populate('event', 'title startAt');

    const [items, total] = await Promise.all([q, Application.countDocuments(where)]);
    res.json({ items, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error listing applications' });
  }
}

// --- ADMIN: STATS ---
export async function applicationStats(req, res) {
  try {
    const grouped = await Application.aggregate([
      { $group: { _id: '$event', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const ids = grouped.map(g => g._id);
    const events = await Event.find({ _id: { $in: ids } }, { title: 1, startAt: 1 });
    const eventMap = Object.fromEntries(events.map(e => [e._id.toString(), e]));

    const stats = grouped.map(g => ({
      eventId: g._id,
      title: eventMap[g._id.toString()]?.title || 'Unknown',
      startAt: eventMap[g._id.toString()]?.startAt || null,
      applications: g.count
    }));

    res.json({ stats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching stats' });
  }
}



