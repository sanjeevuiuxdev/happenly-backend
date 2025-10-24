// server/src/controllers/eventController.js
import Event from '../models/Event.js';
import cloudinary from '../config/cloudinary.js';
import { sendEventCreatedEmail } from '../utils/sendMail.js';
// import { v2 as cloudinary } from 'cloudinary';

/** GET /events */
// add this top-level helper in the file (outside the handler)
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** GET /events */
export async function listEvents(req, res) {
  const { q, department, type, from, to, sort = 'startAt', order = 'asc', page = 1, limit = 10 } = req.query;
  const where = {};
  if (q) where.$text = { $search: q };

  // ✅ case-insensitive exact match for department/type
  if (department) where.department = new RegExp(`^${department}$`, 'i');
  if (type) where.type = new RegExp(`^${type}$`, 'i');  

  if (from || to) {
    where.startAt = {
      ...(from && { $gte: new Date(from) }),
      ...(to && { $lte: new Date(to) }),
    };
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Event.find(where).sort({ [sort]: order === 'desc' ? -1 : 1 }).skip(skip).limit(Number(limit)),
    Event.countDocuments(where),
  ]);

  res.json({ items, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
}


/** GET /events/:id */
export async function getEvent(req, res) {
  const doc = await Event.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json(doc);
}

/** POST /events  (admin) — supports media upload via multer + cloudinary */
export async function createEvent(req, res) {
  const b = req.body;

  const payload = {
    title: b.title,
    description: b.description,
    department: b.department, // must be one of DEPARTMENTS
  organizer: {
    name: b.organizerName || b?.organizer?.name,
    company: b.organizerCompany || b?.organizer?.company,
    email: b.organizerEmail || b?.organizer?.email,
  },
    type: b.type,
    tags: b.tags
      ? (Array.isArray(b.tags) ? b.tags : b.tags.split(',').map(s => s.trim()).filter(Boolean))
      : [],
    startAt: b.startAt ? new Date(b.startAt) : undefined,
    endAt: b.endAt ? new Date(b.endAt) : undefined,
    location: b.location ? (typeof b.location === 'string' ? { name: b.location } : b.location) : undefined,
    createdBy: req.user.id,
    media: [],
  };

  // Upload any attached files
  if (req.files?.length) {
    const uploads = await Promise.all(
      req.files.map(
        (f) =>
          new Promise((resolve, reject) => {
            const resource_type = f.mimetype.startsWith('video') ? 'video' : 'image';
            const stream = cloudinary.uploader.upload_stream(
              { folder: 'happennly/events', resource_type },
              (err, result) => (err ? reject(err) : resolve({ url: result.secure_url, kind: resource_type }))
            );
            stream.end(f.buffer);
          })
      )
    );
    payload.media = uploads;
  }

  const doc = await Event.create(payload);

  // notify the creator (admin)
  try {
    await sendEventCreatedEmail({
      to: req.user.email,
      event: doc,
    });
  } catch (e) {
    console.warn('[mail] failed to send create email', e.message);
  }
  res.status(201).json(doc);
}

/** DELETE /events/:id (admin) */
// export async function removeEvent(req, res) {
//   await Event.findByIdAndDelete(req.params.id);
//   res.json({ ok: true });
// }


/** PATCH /events/:id (admin) */
export async function updateEvent(req, res) {
  try {
    const { id } = req.params;
    const body = req.body;

    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Optional media re-upload (because route now has upload.array)
    if (req.files?.length) {
      const uploads = await Promise.all(
        req.files.map(
          f =>
            new Promise((resolve, reject) => {
              const resource_type = f.mimetype.startsWith('video') ? 'video' : 'image';
              const stream = cloudinary.uploader.upload_stream(
                { folder: 'happennly/events', resource_type },
                (err, result) => (err ? reject(err) : resolve({ url: result.secure_url, kind: resource_type }))
              );
              stream.end(f.buffer);
            })
        )
      );
      body.media = uploads; 
    }

    const updated = await Event.findByIdAndUpdate(id, body, { new: true });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

/** DELETE /events/:id (admin) */
export async function removeEvent(req, res) {
  try {
    const { id } = req.params;
    const doc = await Event.findByIdAndDelete(id);
    if (!doc) return res.status(404).json({ message: 'Event not found' });
    res.json({ ok: true, message: 'Event deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}
