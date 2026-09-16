import News from '../models/News.js';

const createNews = async (req, res) => {
  try {
    const { title, excerpt, content, category, author, image, readTime } = req.body;

    const news = await News.create({
      title,
      excerpt,
      content,
      category,
      author: req.user._id,
      image: image || 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&h=400&fit=crop',
      readTime: readTime || '3 min read',
    });

    const populatedNews = await News.findById(news._id).populate('author', 'fullName avatar');

    res.status(201).json({
      success: true,
      news: populatedNews,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const getNews = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 20, sort = 'newest' } = req.query;

    const query = { isPublished: true };

    if (category && category !== 'all') {
      query.category = category;
    }

    if (search) {
      query.$text = { $search: search };
    }

    const skip = (page - 1) * limit;

    let sortOption = { createdAt: -1 };
    if (sort === 'popular') sortOption = { likes: -1, createdAt: -1 };

    const [news, total] = await Promise.all([
      News.find(query)
        .populate('author', 'fullName avatar')
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit)),
      News.countDocuments(query),
    ]);

    res.json({
      success: true,
      count: news.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      news,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const getNewsById = async (req, res) => {
  try {
    const news = await News.findById(req.params.id).populate('author', 'fullName avatar email');

    if (!news) {
      return res.status(404).json({
        success: false,
        error: 'Article not found.',
      });
    }

    res.json({
      success: true,
      news,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const updateNews = async (req, res) => {
  try {
    const { title, excerpt, content, category, image, readTime, isPublished } = req.body;

    const news = await News.findById(req.params.id);

    if (!news) {
      return res.status(404).json({
        success: false,
        error: 'Article not found.',
      });
    }

    if (news.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this article.',
      });
    }

    news.title = title || news.title;
    news.excerpt = excerpt || news.excerpt;
    news.content = content || news.content;
    news.category = category || news.category;
    news.image = image || news.image;
    news.readTime = readTime || news.readTime;
    news.isPublished = isPublished !== undefined ? isPublished : news.isPublished;

    await news.save();

    const populatedNews = await News.findById(news._id).populate('author', 'fullName avatar');

    res.json({
      success: true,
      news: populatedNews,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const deleteNews = async (req, res) => {
  try {
    const news = await News.findById(req.params.id);

    if (!news) {
      return res.status(404).json({
        success: false,
        error: 'Article not found.',
      });
    }

    if (news.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this article.',
      });
    }

    await news.deleteOne();

    res.json({
      success: true,
      message: 'Article deleted successfully.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const likeNews = async (req, res) => {
  try {
    const news = await News.findById(req.params.id);

    if (!news) {
      return res.status(404).json({
        success: false,
        error: 'Article not found.',
      });
    }

    news.likes += 1;
    await news.save();

    res.json({
      success: true,
      likes: news.likes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const shareNews = async (req, res) => {
  try {
    const news = await News.findById(req.params.id);

    if (!news) {
      return res.status(404).json({
        success: false,
        error: 'Article not found.',
      });
    }

    news.shares += 1;
    await news.save();

    res.json({
      success: true,
      shares: news.shares,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export {
  createNews,
  getNews,
  getNewsById,
  updateNews,
  deleteNews,
  likeNews,
  shareNews,
};