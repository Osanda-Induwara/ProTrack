/**
 * =====================================================
 * Authentication Controller
 * =====================================================
 * 
 * WHY: Separates business logic from routes.
 * Controllers handle:
 * - User signup (create account)
 * - User login (verify credentials)
 * - Password hashing
 * - Token generation
 * 
 * SEPARATION OF CONCERNS:
 * - Routes: Define endpoints (HTTP paths)
 * - Controllers: Implement logic (what happens)
 * - Models: Define data structure
 * 
 * This makes code maintainable and testable.
 */

const User = require('../models/userModel');
const { generateToken } = require('../utils/tokenGen');

/**
 * =====================================================
 * SIGNUP CONTROLLER
 * =====================================================
 * 
 * ROUTE: POST /api/auth/signup
 * REQUEST BODY: { email, password, name }
 * RESPONSE: { success, message, token, user }
 * 
 * FLOW:
 * 1. Validate input
 * 2. Check if user already exists
 * 3. Hash password (automatic via pre-save hook)
 * 4. Save user to database
 * 5. Generate JWT token
 * 6. Send token to client
 */
const signup = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    // ================================================================
    // INPUT VALIDATION
    // ================================================================
    // Check that all required fields are provided
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email, password, and name'
      });
    }

    // Basic password strength check
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // ================================================================
    // CHECK IF USER ALREADY EXISTS
    // ================================================================
    // This prevents duplicate accounts with same email
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already in use. Please login or use a different email.'
      });
    }

    // ================================================================
    // CREATE NEW USER
    // ================================================================
    // WHY separate db operation:
    // - User model has pre-save hook that hashes password
    // - This hook automatically runs when we call save()
    // - Password is never stored in plain text
    const newUser = new User({
      email: email.toLowerCase(),
      password,        // Will be hashed before saving
      name: name.trim()
    });

    // Save user to database
    // This triggers the pre-save hook in userModel.js
    await newUser.save();

    // ================================================================
    // GENERATE JWT TOKEN
    // ================================================================
    // Token includes: userId, email, expiration
    // Client stores this and includes in Authorization header for future requests
    const token = generateToken(newUser._id, newUser.email);

    // ================================================================
    // SEND RESPONSE
    // ================================================================
    // DON'T send password in response (even hashed version)
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id: newUser._id,
        email: newUser.email,
        name: newUser.name
      }
    });

  } catch (error) {
    // Pass to error handler middleware
    next(error);
  }
};


/**
 * =====================================================
 * LOGIN CONTROLLER
 * =====================================================
 * 
 * ROUTE: POST /api/auth/login
 * REQUEST BODY: { email, password }
 * RESPONSE: { success, message, token, user }
 * 
 * FLOW:
 * 1. Validate input
 * 2. Find user by email
 * 3. Compare provided password with hashed password in DB
 * 4. If match, generate token
 * 5. Send token to client
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // ================================================================
    // INPUT VALIDATION
    // ================================================================
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // ================================================================
    // FIND USER IN DATABASE
    // ================================================================
    // Note: .select('+password') includes password field
    // (normally excluded for security, see userModel.js)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // ================================================================
    // VERIFY PASSWORD
    // ================================================================
    // WHY separate matchPassword method:
    // - Can't directly compare plain text with bcrypt hash
    // - Must use bcrypt.compare() to validate
    // - Returns boolean: password matches or not
    const isMatchPassword = await user.matchPassword(password);

    if (!isMatchPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // ================================================================
    // GENERATE TOKEN & SEND RESPONSE
    // ================================================================
    const token = generateToken(user._id, user.email);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      }
    });

  } catch (error) {
    next(error);
  }
};


/**
 * =====================================================
 * GET CURRENT USER CONTROLLER
 * =====================================================
 * 
 * ROUTE: GET /api/auth/me
 * REQUIRES: Authentication (protect middleware)
 * RESPONSE: { success, user }
 * 
 * WHY NEEDED:
 * - Verify user is authenticated (token is valid)
 * - Get current user's full info from database
 * - Used on app startup to restore user session
 * 
 * EXAMPLE USE CASE:
 * App loads -> Calls GET /api/auth/me -> If valid token, 
 * receive user data -> Display dashboard
 */
const getCurrentUser = async (req, res, next) => {
  try {
    // req.user is set by protect middleware
    // Contains: { userId, email }
    
    const user = await User.findById(req.user.userId)
      .populate('boards', 'title description')  // Get user's boards
      .exec();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        boards: user.boards
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  signup,
  login,
  getCurrentUser
};
