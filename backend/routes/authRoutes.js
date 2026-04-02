/**
 * =====================================================
 * Authentication Routes
 * =====================================================
 * 
 * WHY: Defines HTTP endpoints for authentication.
 * Routes are the "entry points" that map URLs to controller functions.
 * 
 * ROUTE STRUCTURE:
 * router.METHOD(path, [middleware], controller)
 * 
 * METHOD: GET, POST, PUT, DELETE
 * MIDDLEWARE: Functions that run before the controller
 *             Example: protect middleware checks JWT
 */

const express = require('express');
const router = express.Router();
const {
  signup,
  login,
  getCurrentUser
} = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

/**
 * PUBLIC ROUTES (No authentication required)
 */

/**
 * POST /api/auth/signup
 * 
 * Purpose: Create new user account
 * Body: { email, password, name }
 * Returns: { success, token, user }
 * 
 * WHY public: Users must be able to create account without auth
 */
router.post('/signup', signup);

/**
 * POST /api/auth/login
 * 
 * Purpose: Authenticate user and get JWT
 * Body: { email, password }
 * Returns: { success, token, user }
 */
router.post('/login', login);


/**
 * PROTECTED ROUTES (Authentication required)
 * - protect middleware checks JWT before controller runs
 * - If JWT invalid, returns 401 error
 */

/**
 * GET /api/auth/me
 * 
 * Purpose: Get current logged-in user data
 * Headers: Authorization: Bearer {token}
 * Returns: { success, user }
 * 
 * USAGE: App startup -> Check if user is logged in
 *        If returns user, display dashboard
 *        If returns 401, show login screen
 */
router.get('/me', protect, getCurrentUser);

module.exports = router;
