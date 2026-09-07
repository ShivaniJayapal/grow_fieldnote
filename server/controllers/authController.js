const authService = require('../services/authService');

class AuthController {
  /**
   * POST /auth/register
   */
  async register(req, res) {
    try {
      const { email, password } = req.body;
      const result = await authService.register({ email, password });

      return res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result,
      });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        error: error.message || 'Internal server error during registration',
      });
    }
  }

  /**
   * POST /auth/login
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;
      const result = await authService.login({ email, password });

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        error: error.message || 'Internal server error during login',
      });
    }
  }

  /**
   * GET /auth/me (Protected route to test verifyToken end-to-end)
   */
  async getMe(req, res) {
    try {
      const user = await authService.getUserById(req.userId);

      return res.status(200).json({
        success: true,
        message: 'Current authenticated user profile',
        data: {
          user,
        },
      });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to fetch user profile',
      });
    }
  }
}

module.exports = new AuthController();

