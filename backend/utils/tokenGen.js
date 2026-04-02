/**
 * =====================================================
 * JWT Token Generation Utility
 * =====================================================
 * 
 * WHY: Centralizes token generation logic.
 * Both signup and login routes use this function.
 * Makes it easy to change token structure in one place.
 * 
 * TOKEN PAYLOAD:
 * - userId: Unique identifier for the user
 * - email: User's email
 * - Expiration: 7 days (standard for web apps)
 */

const jwt = require('jsonwebtoken');

/**
 * generateToken: Creates a signed JWT
 * 
 * PARAMETERS:
 * - userId: MongoDB ObjectId of the user
 * - email: User's email address
 * 
 * RETURNS:
 * - JWT string that can be sent to client in response
 * 
 * WHAT HAPPENS:
 * 1. Creates payload object with user info
 * 2. Signs it with JWT_SECRET (creates signature)
 * 3. Includes expiration time (7 days)
 * 4. Returns encoded JWT string
 * 
 * WHY EXPIRATION:
 * - Limited token life reduces damage if token is stolen
 * - User can request new token by logging in again
 * - Security best practice
 */
const generateToken = (userId, email) => {
  const payload = {
    userId,    // Used to identify user in protected routes
    email      // Used for display/verification
  };

  // Sign the payload with secret and set expiration
  const token = jwt.sign(
    payload,                          // What to encode
    process.env.JWT_SECRET,           // Secret key for signing
    {
      expiresIn: '7d'                 // Token valid for 7 days
    }
  );

  return token;
};

/**
 * Alternative: Using httpOnly cookies (production recommended)
 * 
 * Instead of returning token in response body,
 * production apps should use httpOnly cookies:
 * 
 * Example:
 * res.cookie('token', token, {
 *   httpOnly: true,     // Cannot be accessed by JavaScript
 *   secure: true,       // Only sent over HTTPS
 *   sameSite: 'strict'  // CSRF protection
 * });
 */

module.exports = { generateToken };
