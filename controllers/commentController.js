import Comment from '../models/Comment.js';
import Post from '../models/Post.js';
import Listing from '../models/Listing.js';
import Event from '../models/Event.js';
import News from '../models/News.js';
import { _createNotification as createNotification } from '../controllers/notificationController.js';

export const getComments = async (req, res) => {
  try {
    const { commentableType, commentableId } = req.query;
    const { page = 1, limit = 20, sort = '-createdAt' } = req.query;

    if (!commentableType || !commentableId) {
      return res.status(400).json({
        success: false,
        message: 'commentableType and commentableId are required',
      });
    }

    const filter = { commentableType, commentableId, parentComment: null };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [comments, total] = await Promise.all([
      Comment.find(filter)
        .populate('author', 'fullName email avatar')
        .populate({
          path: 'replies',
          populate: { path: 'author', select: 'fullName email avatar' },
          options: { sort: { createdAt: 1 } },
        })
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Comment.countDocuments(filter),
    ]);

    res.json({
      success: true,
      comments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch comments' });
  }
};

export const getCommentById = async (req, res) => {
  try {
    const { id } = req.params;
    const comment = await Comment.findById(id)
      .populate('author', 'fullName email avatar')
      .populate({
        path: 'replies',
        populate: { path: 'author', select: 'fullName email avatar' },
      })
      .lean();

    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    res.json({ success: true, comment });
  } catch (error) {
    console.error('Get comment error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch comment' });
  }
};

export const createComment = async (req, res) => {
  try {
    const { content, commentableType, commentableId, parentComment } = req.body;
    const author = req.user.id;

    if (!content || !commentableType || !commentableId) {
      return res.status(400).json({
        success: false,
        message: 'Content, commentableType, and commentableId are required',
      });
    }

    if (parentComment) {
      const parent = await Comment.findById(parentComment);
      if (!parent) {
        return res.status(404).json({ success: false, message: 'Parent comment not found' });
      }
      if (parent.commentableType !== commentableType || parent.commentableId.toString() !== commentableId) {
        return res.status(400).json({ success: false, message: 'Parent comment does not match target' });
      }
    }

    const comment = await Comment.create({
      content,
      author,
      commentableType,
      commentableId,
      parentComment: parentComment || null,
    });

    // Create notification for the entity author
    if (!parentComment) {
      let entityAuthor = null;
      let entityTitle = '';
      let notificationType = '';

      switch (commentableType) {
        case 'Post': {
          const post = await Post.findById(commentableId).populate('author', 'fullName');
          if (post) {
            entityAuthor = post.author;
            entityTitle = post.content.substring(0, 50);
            notificationType = 'post_commented';
          }
          break;
        }
        case 'Listing': {
          const listing = await Listing.findById(commentableId).populate('seller', 'fullName');
          if (listing) {
            entityAuthor = listing.seller;
            entityTitle = listing.title;
            notificationType = 'listing_inquired';
          }
          break;
        }
        case 'Event': {
          const event = await Event.findById(commentableId).populate('author', 'fullName');
          if (event) {
            entityAuthor = event.author;
            entityTitle = event.title;
            notificationType = 'event_commented';
          }
          break;
        }
        case 'News': {
          const news = await News.findById(commentableId).populate('author', 'fullName');
          if (news) {
            entityAuthor = news.author;
            entityTitle = news.title;
            notificationType = 'news_commented';
          }
          break;
        }
      }

      if (entityAuthor && !entityAuthor._id.equals(author)) {
        await createNotification({
          user: entityAuthor._id,
          type: notificationType,
          title: 'New Comment',
          message: `${req.user.fullName} commented on "${entityTitle}"`,
          actor: author,
          entityType: commentableType,
          entityId: commentableId,
        });
      }
    } else if (parentComment) {
      // Reply notification to parent comment author
      const parent = await Comment.findById(parentComment).populate('author', 'fullName');
      if (parent && !parent.author._id.equals(author)) {
        await createNotification({
          user: parent.author._id,
          type: 'comment_replied',
          title: 'New Reply',
          message: `${req.user.fullName} replied to your comment`,
          actor: author,
          entityType: 'Comment',
          entityId: parentComment,
        });
      }
    }

    await comment.populate('author', 'fullName email avatar');

    res.status(201).json({ success: true, comment });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ success: false, message: 'Failed to create comment' });
  }
};

export const updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    if (comment.author.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this comment' });
    }

    comment.content = content;
    comment.isEdited = true;
    await comment.save();

    await comment.populate('author', 'fullName email avatar');

    res.json({ success: true, comment });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ success: false, message: 'Failed to update comment' });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    if (comment.author.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this comment' });
    }

    await Comment.deleteMany({ $or: [{ _id: id }, { parentComment: id }] });

    res.json({ success: true, message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete comment' });
  }
};

export const likeComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    const hasLiked = comment.likedBy.includes(userId);
    if (hasLiked) {
      comment.likedBy.pull(userId);
      comment.likes = Math.max(0, comment.likes - 1);
    } else {
      comment.likedBy.push(userId);
      comment.likes += 1;

      // Create notification for comment author
      if (!comment.author.equals(userId)) {
        await createNotification({
          user: comment.author,
          type: 'comment_liked',
          title: 'Comment Liked',
          message: `${req.user.fullName} liked your comment`,
          actor: userId,
          entityType: 'Comment',
          entityId: comment._id,
        });
      }
    }

    await comment.save();
    res.json({ success: true, likes: comment.likes, liked: !hasLiked });
  } catch (error) {
    console.error('Like comment error:', error);
    res.status(500).json({ success: false, message: 'Failed to like comment' });
  }
};

export const getCommentCount = async (req, res) => {
  try {
    const { commentableType, commentableId } = req.query;

    if (!commentableType || !commentableId) {
      return res.status(400).json({
        success: false,
        message: 'commentableType and commentableId are required',
      });
    }

    const count = await Comment.countDocuments({ commentableType, commentableId });

    res.json({ success: true, count });
  } catch (error) {
    console.error('Get comment count error:', error);
    res.status(500).json({ success: false, message: 'Failed to get comment count' });
  }
};