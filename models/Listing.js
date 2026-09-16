import mongoose from 'mongoose';

const listingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price must be a positive number'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['electronics', 'vehicles', 'property', 'jobs', 'services', 'fashion', 'home', 'other', 'clothes_and_shoes', 'furniture', 'phones_electronics', 'building_materials'],
    },
    condition: {
      type: String,
      enum: ['new', 'like_new', 'good', 'fair', 'poor'],
      default: 'good',
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      default: 'Balaka',
    },
    images: [{
      type: String,
      default: [],
    }],
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

listingSchema.index({ title: 'text', description: 'text' });
listingSchema.index({ category: 1, isActive: 1 });
listingSchema.index({ seller: 1 });

const Listing = mongoose.model('Listing', listingSchema);

export default Listing;