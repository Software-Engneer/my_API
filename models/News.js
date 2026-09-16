import mongoose from 'mongoose';

const newsSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    excerpt: {
      type: String,
      required: [true, 'Excerpt is required'],
      maxlength: [500, 'Excerpt cannot exceed 500 characters'],
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['Breaking', 'Development', 'Sports', 'Health', 'Weather', 'Business', 'Education', 'Agriculture'],
    },
    author: {
      type: String,
      required: [true, 'Author is required'],
      trim: true,
    },
    image: {
      type: String,
      default: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&h=400&fit=crop',
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    likes: {
      type: Number,
      default: 0,
    },
    comments: {
      type: Number,
      default: 0,
    },
    shares: {
      type: Number,
      default: 0,
    },
    readTime: {
      type: String,
      default: '3 min read',
    },
  },
  {
    timestamps: true,
  }
);

newsSchema.index({ title: 'text', content: 'text', excerpt: 'text' });
newsSchema.index({ category: 1, isPublished: 1 });
newsSchema.index({ author: 1 });

const News = mongoose.model('News', newsSchema);

export default News;