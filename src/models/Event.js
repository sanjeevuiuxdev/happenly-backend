import mongoose from 'mongoose';

export const DEPARTMENTS = ['IT', 'CS', 'ME', 'Other'];

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, text: true },
    description: { type: String, text: true },

    // dropdown choices
    department: { type: String, enum: DEPARTMENTS, required: true },

    type: String,
    tags: [String],
    startAt: Date,
    endAt: Date,

    location: { name: String, lng: Number, lat: Number },

    // media (image/video from Cloudinary)
    media: [{ url: String, kind: { type: String, enum: ['image', 'video'] } }],

    capacity: Number,
    popularity: { type: Number, default: 0 },

    // organizer details (name + company + optional email)
    organizer: {
      name: { type: String, trim: true },
      company: { type: String, trim: true },
      email: { type: String, trim: true },
    },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

eventSchema.index({ title: 'text', description: 'text', tags: 'text' });

export default mongoose.model('Event', eventSchema);
