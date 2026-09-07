const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: 'Access denied. No authorization header provided.',
    });
  }

  // Support "Bearer <token>" format or bare token
  let token = authHeader;
  if (authHeader.startsWith('Bearer ') || authHeader.startsWith('bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access denied. Token missing from authorization header.',
    });
  }

  try {
    const secret = process.env.JWT_SECRET || 'fieldnote_super_secret_jwt_key_2026_growth';
    const decoded = jwt.verify(token, secret);

    // Attach userId to request object
    req.userId = decoded.userId || decoded.id;
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token.',
      details: error.message,
    });
  }
};

module.exports = verifyToken;

