import mongoose from 'mongoose';
const appSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', index: true },
    status: { type: String, enum: ['applied','waitlist','accepted','rejected'], default: 'applied' }
  },
  { timestamps: true }
);
appSchema.index({ user: 1, event: 1 }, { unique: true });
export default mongoose.model('Application', appSchema);
