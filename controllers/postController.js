import Post from '../models/Post.js';
import User from '../models/User.js';

export const getPosts = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [posts, total] = await Promise.all([
      Post.find()
        .populate('author', 'fullName avatar email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Post.countDocuments(),
    ]);

    const transformedPosts = posts.map(post => ({
      id: post._id,
      author: post.author?.fullName || 'Unknown',
      avatar: post.author?.avatar || '👤',
      time: post.createdAt,
      content: post.content,
      likes: post.likes,
      comments: post.commentsCount,
      shares: post.shares,
      image: post.image,
      _raw: post,
    }));

    res.json({
      success: true,
      posts: transformedPosts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch posts' });
  }
};

export const getPostById = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id).populate('author', 'fullName avatar email').lean();

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const transformed = {
      id: post._id,
      author: post.author?.fullName || 'Unknown',
      avatar: post.author?.avatar || '👤',
      time: post.createdAt,
      content: post.content,
      likes: post.likes,
      comments: post.commentsCount,
      shares: post.shares,
      image: post.image,
      _raw: post,
    };

    res.json({ success: true, post: transformed });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch post' });
  }
};

export const createPost = async (req, res) => {
  try {
    const { content, image } = req.body;
    const author = req.user.id;

    if (!content?.trim()) {
      return res.status(400).json({ success: false, message: 'Post content is required' });
    }

    const post = await Post.create({
      content: content.trim(),
      author,
      image: image || '',
    });

    await post.populate('author', 'fullName avatar email');

    const transformed = {
      id: post._id,
      author: post.author.fullName,
      avatar: post.author.avatar || '👤',
      time: post.createdAt,
      content: post.content,
      likes: post.likes,
      comments: post.commentsCount,
      shares: post.shares,
      image: post.image,
      _raw: post,
    };

    res.status(201).json({ success: true, post: transformed });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ success: false, message: 'Failed to create post' });
  }
};

export const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (!post.author.equals(userId)) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this post' });
    }

    post.content = content.trim();
    await post.save();

    await post.populate('author', 'fullName avatar email');

    const transformed = {
      id: post._id,
      author: post.author.fullName,
      avatar: post.author.avatar || '👤',
      time: post.createdAt,
      content: post.content,
      likes: post.likes,
      comments: post.commentsCount,
      shares: post.shares,
      image: post.image,
      _raw: post,
    };

    res.json({ success: true, post: transformed });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ success: false, message: 'Failed to update post' });
  }
};

export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (!post.author.equals(userId)) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this post' });
    }

    await Post.findByIdAndDelete(id);

    res.json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete post' });
  }
};

export const likePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const hasLiked = post.likedBy.includes(userId);
    if (hasLiked) {
      post.likedBy.pull(userId);
      post.likes = Math.max(0, post.likes - 1);
    } else {
      post.likedBy.push(userId);
      post.likes += 1;
    }

    await post.save();
    res.json({ success: true, likes: post.likes, liked: !hasLiked });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ success: false, message: 'Failed to like post' });
  }
};

export const sharePost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    post.shares += 1;
    await post.save();
    res.json({ success: true, shares: post.shares });
  } catch (error) {
    console.error('Share post error:', error);
    res.status(500).json({ success: false, message: 'Failed to share post' });
  }
};