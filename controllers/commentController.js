import Comment from '../models/Comment.js';

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
        .populate('author', 'name email avatar')
        .populate({
          path: 'replies',
          populate: { path: 'author', select: 'name email avatar' },
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
      .populate('author', 'name email avatar')
      .populate({
        path: 'replies',
        populate: { path: 'author', select: 'name email avatar' },
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

    await comment.populate('author', 'name email avatar');

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

    await comment.populate('author', 'name email avatar');

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