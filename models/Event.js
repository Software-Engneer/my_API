import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    date: {
      type: String,
      required: [true, 'Date is required'],
    },
    time: {
      type: String,
      required: [true, 'Time is required'],
    },
    venue: {
      type: String,
      required: [true, 'Venue is required'],
      trim: true,
    },
    organizer: {
      type: String,
      required: [true, 'Organizer is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['Community', 'Entertainment', 'Business', 'Sports', 'Education'],
    },
    image: {
      type: String,
      default: 'https://images.unsplash.com/photo-1511632765486-a01980e01a2c?w=600&h=300&fit=crop',
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    attendees: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

eventSchema.index({ title: 'text', description: 'text' });
eventSchema.index({ category: 1, isPublished: 1 });
eventSchema.index({ author: 1 });
eventSchema.index({ date: 1 });

const Event = mongoose.model('Event', eventSchema);

export default Event;