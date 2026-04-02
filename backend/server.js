/**
 * =====================================================
 * MAIN SERVER FILE
 * =====================================================
 * 
 * WHY: Entry point for the application.
 * This file:
 * 1. Initializes Express server
 * 2. Connects to MongoDB
 * 3. Sets up middleware
 * 4. Registers routes
 * 5. Initializes Socket.io
 * 6. Starts listening for requests
 * 
 * TYPICAL STARTUP SEQUENCE:
 * npm start -> node server.js -> Connects to DB, starts server
 */

require('dotenv').config();  // Load environment variables from .env

const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');

// Import database connection
const connectDB = require('./config/db');

// Import middleware
const { errorHandler } = require('./middlewares/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const boardRoutes = require('./routes/boardRoutes');
const taskRoutes = require('./routes/taskRoutes');
const commentRoutes = require('./routes/commentRoutes');

// Import Socket.io setup
const { setupSocketEvents } = require('./utils/socketManager');

// =====================================================
// INITIALIZATION
// =====================================================

// Create Express app
const app = express();

// Create HTTP server (needed for Socket.io)
// Socket.io works with HTTP server, not just Express
const server = http.createServer(app);

// Initialize Socket.io
// CORS configured to allow frontend to connect
const io = socketIO(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Connect to MongoDB (waits for connection before starting server)
connectDB();

// =====================================================
// MIDDLEWARE
// =====================================================

/**
 * CORS: Allow frontend to make requests to this backend
 * 
 * WHY NEEDED:
 * Frontend runs on http://localhost:3000
 * Backend runs on http://localhost:5000
 * By default, browsers block cross-origin requests
 * CORS middleware allows this communication
 */
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true  // Allow cookies/auth headers
}));

/**
 * BODY PARSERS: Parse incoming request bodies
 * 
 * json(): Parse application/json content-type
 *         Example: POST with JSON body
 * 
 * urlencoded(): Parse application/x-www-form-urlencoded
 *               Example: Form submissions
 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// =====================================================
// ROUTES
// =====================================================

/**
 * Route registration structure:
 * app.use('/api/path', routerModule)
 * 
 * Example:
 * POST /api/auth/signup -> authRoutes -> signup controller
 * GET /api/boards -> boardRoutes -> getAllBoards controller
 */

// Authentication routes (signup, login, get user)
app.use('/api/auth', authRoutes);

// Board routes (create, read, update, delete boards)
app.use('/api/boards', boardRoutes);

// Task routes (create, read, update, delete tasks)
// Routes already include /boards/:boardId/tasks, so mount at /api
app.use('/api', taskRoutes);

// Comment routes (add, read, delete comments)
app.use('/api/comments', commentRoutes);

/**
 * Health check endpoint
 * 
 * PURPOSE: Verify server is running
 * USAGE: GET http://localhost:5000/health
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// =====================================================
// SOCKET.IO CONNECTION HANDLING
// =====================================================

/**
 * io.on('connection'): Triggered when user connects via WebSocket
 * 
 * FLOW:
 * 1. Frontend: io.connect() establishes WebSocket connection
 * 2. Backend: io.on('connection') is triggered
 * 3. Backend: setupSocketEvents configures all event listeners
 * 4. Users can now emit/listen to real-time events
 * 
 * WHY Socket.io over pure WebSocket:
 * - Automatic reconnection on disconnect
 * - Rooms (group users together)
 * - Events (structured communication)
 * - Fallbacks (WebSocket -> polling if WebSocket unavailable)
 */
io.on('connection', (socket) => {
  console.log('🔌 New WebSocket connection:', socket.id);

  // Setup all real-time event listeners for this socket
  setupSocketEvents(io, socket);
});

// =====================================================
// ERROR HANDLING
// =====================================================

/**
 * ERROR HANDLER MIDDLEWARE
 * 
 * WHY LAST: Express tries middlewares in order.
 * errorHandler must be last to catch all errors.
 * 
 * If any route throws error and passes to next(error),
 * this middleware catches it and sends proper response.
 */
app.use(errorHandler);

// =====================================================
// SERVER START
// =====================================================

const PORT = process.env.PORT || 5000;

/**
 * Start listening for requests
 * 
 * server.listen() (not app.listen()) because we need HTTP server for Socket.io
 * Starts listening on specified port
 */
server.listen(PORT, () => {
  console.log(`
  ✅ Server started successfully!
  📍 API: http://localhost:${PORT}
  🎯 Health check: http://localhost:${PORT}/health
  🔌 WebSocket ready for connections
  
  Environment: ${process.env.NODE_ENV || 'development'}
  Database: ${process.env.MONGO_URI.split('@')[1] || 'local MongoDB'}
  `);
});

/**
 * GRACEFUL SHUTDOWN
 * 
 * Handles CTRL+C (SIGINT signal)
 * Closes database and server gracefully
 * Prevents data loss and hanging connections
 */
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

module.exports = { app, io };
