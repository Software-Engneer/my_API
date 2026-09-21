import Notification from '../models/Notification.js';

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = { user: userId };
    if (unreadOnly === 'true') {
      filter.read = false;
    }

    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .populate('actor', 'fullName avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Notification.countDocuments(filter),
    ]);

    res.json({
      success: true,
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await Notification.countDocuments({ user: userId, read: false });
    res.json({ success: true, count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ success: false, message: 'Failed to get unread count' });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    if (!notification.user.equals(userId)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    notification.read = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark as read' });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await Notification.updateMany(
      { user: userId, read: false },
      { read: true, readAt: new Date() }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark all as read' });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    if (!notification.user.equals(userId)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await Notification.findByIdAndDelete(id);
    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete notification' });
  }
};

// Helper function to create notifications (used by other controllers)
export const createNotification = async ({
  user,
  type,
  title,
  message,
  actor,
  entityType,
  entityId,
}) => {
  try {
    if (user.toString() === actor.toString()) {
      return null; // Don't notify self
    }

    const notification = await Notification.create({
      user,
      type,
      title,
      message,
      actor,
      entityType,
      entityId,
    });

    // Emit real-time notification via Socket.io if available
    // const io = req.app.get('io');
    // if (io) {
    //   io.to(user.toString()).emit('notification', notification);
    // }

    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
    return null;
  }
};

export { createNotification as _createNotification };