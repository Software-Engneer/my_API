import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

const signup = async (req, res) => {
  try {
    const { fullName, email, phone, password } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedPhone = phone?.trim();

    if (!fullName?.trim() || !normalizedEmail || !normalizedPhone || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide all required fields.',
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { phone: normalizedPhone }],
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email or phone already exists.',
      });
    }

    let user;
    try {
      user = await User.create({
        fullName: fullName.trim(),
        email: normalizedEmail,
        phone: normalizedPhone,
        password,
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          error: 'An account with this email or phone already exists.',
        });
      }
      throw error;
    }

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const signin = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email/phone and password.',
      });
    }

    const user = await User.findOne({
      $or: [{ email: identifier.toLowerCase() }, { phone: identifier }],
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email/phone or password.',
      });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email/phone or password.',
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { fullName, bio, location, avatar } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { fullName, bio, location, avatar },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export { signup, signin, getProfile, updateProfile };
