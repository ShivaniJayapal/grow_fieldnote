const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

class AuthService {
  /**
   * Issue signed JWT for a given user
   */
  generateToken(userId, email) {
    const secret = process.env.JWT_SECRET || 'fieldnote_super_secret_jwt_key_2026_growth';
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

    return jwt.sign({ userId, email }, secret, { expiresIn });
  }

  /**
   * Register a new user
   */
  async register({ email, password }) {
    if (!email || !password) {
      const err = new Error('Email and password are required');
      err.statusCode = 400;
      throw err;
    }

    const cleanEmail = email.trim().toLowerCase();

    if (password.length < 6) {
      const err = new Error('Password must be at least 6 characters long');
      err.statusCode = 400;
      throw err;
    }

    // Check for existing user
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      const err = new Error('A user with this email address already exists');
      err.statusCode = 409;
      throw err;
    }

    // Hash password with bcrypt (10 salt rounds)
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Persist new user
    const user = await User.create({
      email: cleanEmail,
      passwordHash,
    });

    // Generate token
    const token = this.generateToken(user._id, user.email);

    return {
      user: {
        id: user._id,
        email: user.email,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  /**
   * Authenticate an existing user
   */
  async login({ email, password }) {
    if (!email || !password) {
      const err = new Error('Email and password are required');
      err.statusCode = 400;
      throw err;
    }

    const cleanEmail = email.trim().toLowerCase();

    // Find user by email
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      const err = new Error('Invalid email or password');
      err.statusCode = 401;
      throw err;
    }

    // Compare hashed password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      const err = new Error('Invalid email or password');
      err.statusCode = 401;
      throw err;
    }

    // Generate token
    const token = this.generateToken(user._id, user.email);

    return {
      user: {
        id: user._id,
        email: user.email,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  /**
   * Fetch user details by ID
   */
  async getUserById(userId) {
    const user = await User.findById(userId).select('-passwordHash');
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }
    return user;
  }
}

module.exports = new AuthService();

