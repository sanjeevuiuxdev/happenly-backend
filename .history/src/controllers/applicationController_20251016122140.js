// server/src/controllers/applicationController.js
import Application from '../models/Application.js';
import Event from '../models/Event.js';
import { sendEventAppliedEmail } from '../utils/sendMail.js';

/**
 * USER: Apply for an event
 * POST /api/v1/applications
 * body: { eventId, note? }
 */
export async function apply(req, res) {
  try {
    const { eventId, note } = req.body;
    const userId = req.user?.id || req.user?._id;

    if (!eventId) {
      return res.status(400).json({ message: 'eventId is required' });
    }

    // Ensure event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Prevent duplicate application by same user
    const existing = await Application.findOne({ event: eventId, user: userId });
    if (existing) {
      return res.status(400).json({ message: 'You already applied for this event' });
    }

    // Create application
    const app = await Application.create({
      event: eventId,
      user: userId,
      note: note || '',
      status: 'pending', // or 'applied' if that’s your schema
    });

    // Fire-and-forget email (don’t block response if it fails)
    sendEventAppliedEmail({
      to: req.user.email,
      userName: req.user.name,
      event,
    }).catch(err => console.warn('[mail] failed to send apply email:', err.message));

    return res.status(201).json(app);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error while applying' });
  }
}

/**
 * ADMIN: List applicants for a specific event
 * GET /api/v1/applications/event/:id
 */
export async function listApplicants(req, res) {
  try {
    const apps = await Application.find({ event: req.params.id })
      .populate('user', 'name email')
      .populate('event', 'title startAt');
    return res.json(apps);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error fetching applicants' });
  }
}

/**
 * ADMIN: List all applications (with filters + pagination)
 * GET /api/v1/applications?eventId=&status=&page=&limit=
 */
export async function listAllApplications(req, res) {
  try {
    const { eventId, status, page = 1, limit = 25 } = req.query;

    const where = {};
    if (eventId) where.event = eventId;
    if (status) where.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const query = Application.find(where)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('user', 'name email')
      .populate('event', 'title startAt');

    const [items, total] = await Promise.all([
      query,
      Application.countDocuments(where),
    ]);

    return res.json({
      items,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error listing applications' });
  }
}

/**
 * ADMIN: Applications per event stats
 * GET /api/v1/applications/stats
 */
export async function applicationStats(req, res) {
  try {
    const grouped = await Application.aggregate([
      { $group: { _id: '$event', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const ids = grouped.map(g => g._id);
    const events = await Event.find({ _id: { $in: ids } }, { title: 1, startAt: 1 });
    const eventMap = Object.fromEntries(events.map(e => [e._id.toString(), e]));

    const stats = grouped.map(g => ({
      eventId: g._id,
      title: eventMap[g._id.toString()]?.title || 'Unknown',
      startAt: eventMap[g._id.toString()]?.startAt || null,
      applications: g.count,
    }));

    return res.json({ stats });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error fetching stats' });
  }
}
