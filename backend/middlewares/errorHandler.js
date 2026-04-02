/**
 * =====================================================
 * Error Handling Middleware
 * =====================================================
 * 
 * WHY: Centralizes error handling across the entire API.
 * All errors are caught and returned in consistent format.
 * 
 * STANDARD ERROR RESPONSE FORMAT:
 * {
 *   success: false,
 *   message: "Error description",
 *   error: "Detailed error info (only in development)"
 * }
 * 
 * NOTE: This middleware should be defined LAST in Express app setup
 * Example: app.use(errorHandler) should be the last app.use() call
 */

/**
 * errorHandler: Global error handling middleware
 * 
 * Express will automatically pass errors to this middleware
 * if 4 parameters are defined (err, req, res, next)
 * 
 * USAGE: Automatically invoked when any error is thrown in routes/controllers
 * EXAMPLE: 
 *   try { 
 *     throw new Error('Something went wrong');
 *   } catch(error) {
 *     next(error);  // Passes to errorHandler
 *   }
 */
const errorHandler = (err, req, res, next) => {
  // Ensure error status code is set (default 500 for server errors)
  const status = err.status || err.statusCode || 500;
  
  // Ensure error message exists
  const message = err.message || 'Internal Server Error';

  // Log error to console for debugging
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ ERROR:', {
      status,
      message,
      stack: err.stack
    });
  } else {
    // Production: don't expose stack traces
    console.error('❌ ERROR:', { status, message });
  }

  // Handle MongoDB/Mongoose errors
  if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    if (err.code === 11000) {  // Duplicate key error
      return res.status(400).json({
        success: false,
        message: 'Duplicate field value entered. Please use a different value.'
      });
    }
  }

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: messages
    });
  }

  // Send error response
  return res.status(status).json({
    success: false,
    message,
    // Only show stack trace in development
    ...(process.env.NODE_ENV === 'development' && { error: err.stack })
  });
};

module.exports = { errorHandler };
