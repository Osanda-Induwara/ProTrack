/**
 * =====================================================
 * Authentication Middleware
 * =====================================================
 * 
 * WHY: Protects routes by verifying JWT tokens in every request.
 * This middleware is applied to all routes that require authentication.
 * 
 * HOW IT WORKS:
 * 1. Extract JWT from Authorization header
 * 2. Verify the token using JWT_SECRET
 * 3. Extract user info from token payload
 * 4. Attach user data to request object for controllers to use
 * 5. If invalid, reject the request
 * 
 * SECURITY NOTE:
 * - Always send JWT in Authorization header as "Bearer {token}"
 * - Never store JWT in localStorage/sessionStorage in actual production (use httpOnly cookies)
 * - JWT contains decoded user data, don't expose sensitive info in token
 */

const jwt = require('jsonwebtoken');

/**
 * protect: Middleware function to verify JWT and authenticate requests
 * 
 * USAGE: app.get('/api/private-route', protect, controller)
 * 
 * REQUEST EXPECTED FORMAT:
 * Headers: { Authorization: "Bearer eyJhbGciOiJIUzI1NiIs..." }
 * 
 * RESPONSE ON SUCCESS:
 * - Adds req.user object with decoded token data
 * - Calls next() to proceed to the next middleware/controller
 * 
 * RESPONSE ON FAILURE:
 * - Returns 401 Unauthorized
 */
const protect = (req, res, next) => {
  try {
    // ================================================================
    // STEP 1: Extract token from Authorization header
    // ================================================================
    const authHeader = req.headers.authorization;

    let token = null;

    // Check if Authorization header exists and follows correct format
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Extract token from "Bearer {token}"
      token = authHeader.slice(7);  // Remove "Bearer " prefix
    }

    // If no token found, return error
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route. Please provide a token.'
      });
    }

    // ================================================================
    // STEP 2: Verify the JWT token
    // ================================================================
    // jwt.verify() checks:
    // - Token signature (hasn't been tampered with)
    // - Token hasn't expired
    // - Token was signed with the correct secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ================================================================
    // STEP 3: Attach decoded user info to request object
    // ================================================================
    // decoded contains: { userId, email, iat (issued at), exp (expiration) }
    // Controllers can now access user info via req.user
    req.user = decoded;

    // ================================================================
    // STEP 4: Proceed to next middleware/controller
    // ================================================================
    next();

  } catch (error) {
    // Handle different JWT errors
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please login again.'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Authentication failed.',
      error: error.message
    });
  }
};

module.exports = { protect };
