import Application from '../models/Application.js';
import Event from '../models/Event.js';
import { v2 as cloudinary } from 'cloudinary';

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



// ✅ Update event (with optional media re-upload)
export async function updateEvent(req, res) {
  try {
    const { id } = req.params;
    const body = req.body;

    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // handle new file uploads (if multipart form)
    if (req.files?.length) {
      const uploads = await Promise.all(
        req.files.map(f =>
          new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              { resource_type: 'auto' },
              (err, result) => (err ? reject(err) : resolve(result))
            );
            stream.end(f.buffer);
          })
        )
      );
      body.media = uploads.map(u => ({
        url: u.secure_url,
        kind: u.resource_type === 'video' ? 'video' : 'image',
      }));
    }

    const updated = await Event.findByIdAndUpdate(id, body, { new: true });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

// ✅ Delete event
export async function deleteEvent(req, res) {
  try {
    const { id } = req.params;
    const e = await Event.findByIdAndDelete(id);
    if (!e) return res.status(404).json({ message: 'Event not found' });
    res.json({ message: 'Event deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}