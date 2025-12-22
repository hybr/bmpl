/**
 * Authentication Middleware
 * Validates JWT tokens and adds user info to request context
 */

const jwt = require('jsonwebtoken');

module.exports = {
  /**
   * Authenticate request using JWT Bearer token
   */
  authenticate(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.writeHead(401, { 'Content-Type': 'application/json' }).end(
        JSON.stringify({
          error: 'Unauthorized',
          message: 'Missing or invalid Authorization header'
        })
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Add user info to request
      req.$ctx.meta.user = {
        id: decoded.userId,
        username: decoded.username,
        email: decoded.email
      };

      next();
    } catch (error) {
      return res.writeHead(401, { 'Content-Type': 'application/json' }).end(
        JSON.stringify({
          error: 'Unauthorized',
          message: 'Invalid or expired token'
        })
      );
    }
  },

  /**
   * Optional authentication - doesn't fail if no token provided
   */
  optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.$ctx.meta.user = {
          id: decoded.userId,
          username: decoded.username,
          email: decoded.email
        };
      } catch (error) {
        // Token invalid but continue anyway
        console.warn('Invalid token provided:', error.message);
      }
    }

    next();
  }
};
