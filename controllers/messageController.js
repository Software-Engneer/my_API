import Message from '../models/Message.js';
import User from '../models/User.js';
import { _createNotification as createNotification } from '../controllers/notificationController.js';

export const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: userId }, { recipient: userId }],
          parentMessage: null,
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', userId] },
              '$recipient',
              '$sender',
            ],
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$recipient', userId] }, { $eq: ['$read', false] }] },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'otherUser',
        },
      },
      { $unwind: '$otherUser' },
      {
        $project: {
          _id: 1,
          otherUser: {
            _id: 1,
            fullName: 1,
            avatar: 1,
            email: 1,
          },
          lastMessage: {
            _id: 1,
            content: 1,
            sender: 1,
            createdAt: 1,
            read: 1,
          },
          unreadCount: 1,
        },
      },
    ]);

    res.json({ success: true, conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch conversations' });
  }
};

export const getMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { otherUserId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [messages, total] = await Promise.all([
      Message.find({
        parentMessage: null,
        $or: [
          { sender: userId, recipient: otherUserId },
          { sender: otherUserId, recipient: userId },
        ],
      })
        .populate('sender', 'fullName avatar')
        .populate('recipient', 'fullName avatar')
        .populate({
          path: 'replies',
          populate: { path: 'sender recipient', select: 'fullName avatar' },
          options: { sort: { createdAt: 1 } },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Message.countDocuments({
        parentMessage: null,
        $or: [
          { sender: userId, recipient: otherUserId },
          { sender: otherUserId, recipient: userId },
        ],
      }),
    ]);

    await Message.updateMany(
      {
        recipient: userId,
        sender: otherUserId,
        read: false,
        parentMessage: null,
      },
      { read: true, readAt: new Date() }
    );

    res.json({
      success: true,
      messages: messages.reverse(),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { recipientId, content, parentMessageId } = req.body;

    if (!recipientId || !content?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Recipient and content are required',
      });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ success: false, message: 'Recipient not found' });
    }

    if (recipientId === senderId) {
      return res.status(400).json({ success: false, message: 'Cannot message yourself' });
    }

    if (parentMessageId) {
      const parent = await Message.findById(parentMessageId);
      if (!parent) {
        return res.status(404).json({ success: false, message: 'Parent message not found' });
      }
      if (!parent.recipient.equals(senderId) && !parent.sender.equals(senderId)) {
        return res.status(403).json({ success: false, message: 'Not authorized to reply to this message' });
      }
    }

    const message = await Message.create({
      sender: senderId,
      recipient: recipientId,
      content: content.trim(),
      parentMessage: parentMessageId || null,
    });

    await message.populate('sender', 'fullName avatar');
    await message.populate('recipient', 'fullName avatar');

    // Create notification for recipient
    await createNotification({
      user: recipientId,
      type: 'message_received',
      title: 'New Message',
      message: `${req.user.fullName} sent you a message`,
      actor: senderId,
      entityType: 'Message',
      entityId: message._id,
    });

    const io = req.app.get('io');
    if (io) {
      io.to(recipientId.toString()).emit('newMessage', message);
    }

    res.status(201).json({ success: true, message });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    if (!message.recipient.equals(userId)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    message.read = true;
    message.readAt = new Date();
    await message.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark as read' });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    if (!message.sender.equals(userId)) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this message' });
    }

    await Message.deleteMany({ $or: [{ _id: messageId }, { parentMessage: messageId }] });

    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete message' });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const count = await Message.countDocuments({
      recipient: userId,
      read: false,
      parentMessage: null,
    });

    res.json({ success: true, count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ success: false, message: 'Failed to get unread count' });
  }
};