import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        'post_created',
        'post_liked',
        'post_commented',
        'post_shared',
        'listing_created',
        'listing_liked',
        'listing_inquired',
        'event_created',
        'event_attending',
        'news_created',
        'news_liked',
        'news_commented',
        'message_received',
        'comment_replied',
        'comment_liked',
        'user_followed',
      ],
    },
    title: {
      type: String,
      required: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    message: {
      type: String,
      required: true,
      maxlength: [500, 'Message cannot exceed 500 characters'],
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    entityType: {
      type: String,
      enum: ['Post', 'Listing', 'Event', 'News', 'Message', 'Comment', 'User'],
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    read: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, read: 1 });
notificationSchema.index({ entityType: 1, entityId: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;