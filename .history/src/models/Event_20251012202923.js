import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, text: true },
    description: { type: String, text: true },
    department: String,
    type: String,
    tags: [String],
    startAt: Date,
    endAt: Date,
    location: { name: String, lng: Number, lat: Number },
    media: [{ url: String, kind: { type: String, enum: ['image','video'] } }],
    capacity: Number,
    popularity: { type: Number, default: 0 },
    organizer: { name: String, email: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

eventSchema.index({ title: 'text', description: 'text', tags: 'text' });

export default mongoose.model('Event', eventSchema);
