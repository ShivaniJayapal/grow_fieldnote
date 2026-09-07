const express = require('express');
const authController = require('../controllers/authController');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();

/**
 * @route   POST /auth/register
 * @desc    Register a new user, hash password with bcrypt, and issue JWT
 * @access  Public
 */
router.post('/register', (req, res) => authController.register(req, res));

/**
 * @route   POST /auth/login
 * @desc    Authenticate user credentials and issue JWT
 * @access  Public
 */
router.post('/login', (req, res) => authController.login(req, res));

/**
 * @route   GET /auth/me
 * @desc    Get currently authenticated user (requires valid JWT in Authorization header)
 * @access  Protected
 */
router.get('/me', verifyToken, (req, res) => authController.getMe(req, res));

module.exports = router;

