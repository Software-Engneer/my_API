import Listing from '../models/Listing.js';

const createListing = async (req, res) => {
  try {
    const { title, description, price, category, condition, location, images } = req.body;

    const listing = await Listing.create({
      title,
      description,
      price,
      category,
      condition,
      location,
      images: images || [],
      seller: req.user._id,
    });

    res.status(201).json({
      success: true,
      listing,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const getListings = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;

    const query = { isActive: true };

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$text = { $search: search };
    }

    const skip = (page - 1) * limit;

    const [listings, total] = await Promise.all([
      Listing.find(query)
        .populate('seller', 'fullName avatar location')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Listing.countDocuments(query),
    ]);

    res.json({
      success: true,
      count: listings.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      listings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const getListingById = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate('seller', 'fullName avatar location phone email');

    if (!listing) {
      return res.status(404).json({
        success: false,
        error: 'Listing not found.',
      });
    }

    listing.views += 1;
    await listing.save();

    res.json({
      success: true,
      listing,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const updateListing = async (req, res) => {
  try {
    const { title, description, price, category, condition, location, images, isActive } = req.body;

    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        error: 'Listing not found.',
      });
    }

    if (listing.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this listing.',
      });
    }

    listing.title = title || listing.title;
    listing.description = description || listing.description;
    listing.price = price || listing.price;
    listing.category = category || listing.category;
    listing.condition = condition || listing.condition;
    listing.location = location || listing.location;
    listing.images = images || listing.images;
    listing.isActive = isActive !== undefined ? isActive : listing.isActive;

    await listing.save();

    res.json({
      success: true,
      listing,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const deleteListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        error: 'Listing not found.',
      });
    }

    if (listing.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this listing.',
      });
    }

    await listing.deleteOne();

    res.json({
      success: true,
      message: 'Listing deleted successfully.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const getMyListings = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const [listings, total] = await Promise.all([
      Listing.find({ seller: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Listing.countDocuments({ seller: req.user._id }),
    ]);

    res.json({
      success: true,
      count: listings.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      listings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export {
  createListing,
  getListings,
  getListingById,
  updateListing,
  deleteListing,
  getMyListings,
};