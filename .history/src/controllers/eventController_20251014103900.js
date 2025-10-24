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


// ...existing handlers (listEvents, getEvent)

export async function createEvent(req, res) {
  const body = req.body;

  // Convert stringified fields when multipart/form-data
  const payload = {
    title: body.title,
    description: body.description,
    department: body.department,
    type: body.type,
    tags: body.tags ? (Array.isArray(body.tags) ? body.tags : body.tags.split(',').map(s=>s.trim()).filter(Boolean)) : [],
    startAt: body.startAt ? new Date(body.startAt) : undefined,
    endAt: body.endAt ? new Date(body.endAt) : undefined,
    location: body.location ? (typeof body.location === 'string' ? { name: body.location } : body.location) : undefined,
    createdBy: req.user.id,
    media: []
  };

  // Upload each file to Cloudinary
  if (req.files?.length) {
    const uploads = await Promise.all(
      req.files.map(f => new Promise((resolve, reject) => {
        const resource_type = f.mimetype.startsWith('video') ? 'video' : 'image';
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'happennly/events', resource_type },
          (err, result) => err ? reject(err) : resolve({ url: result.secure_url, kind: resource_type })
        );
        stream.end(f.buffer);
      }))
    );
    payload.media = uploads;
  }

  const doc = await Event.create(payload);
  res.status(201).json(doc);
}

export async function updateEvent(req, res) {
  const doc = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json(doc);
}