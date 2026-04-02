/**
 * =====================================================
 * Socket.io Client Setup
 * =====================================================
 * 
 * WHY: Manages WebSocket connection to backend.
 * Handles real-time events like:
 * - Task moved in Kanban
 * - Comment added
 * - User joined/left board
 * 
 * SOCKET.IO vs REST API:
 * 
 * REST API:
 * - Request-response model
 * - Client must request data
 * - No automatic updates
 * 
 * Socket.io (WebSocket):
 * - Persistent connection
 * - Server pushes updates to client
 * - Real-time, no request needed
 * 
 * EXAMPLE FLOW:
 * 1. User A moves task on their Kanban board
 * 2. Socket emits: socket.emit('task:move', {...})
 * 3. Backend updates database
 * 4. Backend broadcasts: io.to('board-1').emit('task:updated', {...})
 * 5. User B's browser receives instant update
 * 6. User B's UI re-renders without page refresh
 */

import io from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// Create socket instance (but don't connect yet)
let socket = null;

/**
 * initSocket: Establish WebSocket connection
 * 
 * WHEN TO CALL:
 * - On app startup (or after login)
 * 
 * WHY LAZY CONNECTION:
 * - Don't connect before user logs in
 * - Reduces server load
 * - User can use app offline if needed
 */
export const initSocket = () => {
  if (socket) {
    return socket;  // Already connected
  }

  socket = io(SOCKET_URL, {
    reconnection: true,           // Auto-reconnect if connection lost
    reconnectionDelay: 1000,      // Wait 1s before reconnecting
    reconnectionDelayMax: 5000,   // Max wait 5s
    reconnectionAttempts: 5       // Try max 5 times
  });

  // ================================================================
  // CONNECTION EVENTS
  // ================================================================

  socket.on('connect', () => {
    console.log('✅ Socket.io connected:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ Socket.io disconnected:', reason);
  });

  socket.on('error', (error) => {
    console.error('Socket.io error:', error);
  });

  return socket;
};

/**
 * getSocket: Get current socket instance
 * 
 * USAGE: In React components to emit events
 * const socket = getSocket();
 * socket.emit('task:move', { taskId, newStatus });
 */
export const getSocket = () => {
  if (!socket) {
    return initSocket();
  }
  return socket;
};

/**
 * disconnectSocket: Close WebSocket connection
 * 
 * WHEN TO CALL:
 * - On logout
 * - Before closing app
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * EXAMPLE SOCKET EVENT LISTENERS/EMITTERS
 * (These are used in React components)
 * 
 * ================================================================
 * JOINING A BOARD ROOM (when user opens board)
 * ================================================================
 * const socket = getSocket();
 * socket.emit('user:join-board', { boardId, userId });
 * 
 * ================================================================
 * LISTENING FOR TASK UPDATES
 * ================================================================
 * socket.on('task:updated', (data) => {
 *   console.log('Task moved:', data);
 *   // Update React state to re-render board
 * });
 * 
 * ================================================================
 * MOVING A TASK (drag-drop)
 * ================================================================
 * socket.emit('task:move', {
 *   taskId: '123',
 *   newStatus: 'In Progress',
 *   boardId: 'board-456'
 * });
 * 
 * ================================================================
 * LISTENING FOR COMMENTS
 * ================================================================
 * socket.on('comment:added', (data) => {
 *   console.log('New comment:', data);
 *   // Update React state with new comment
 * });
 * 
 * ================================================================
 * ADDING A COMMENT (real-time)
 * ================================================================
 * socket.emit('comment:add', {
 *   taskId: '123',
 *   text: 'Great work!',
 *   userId: 'user-456',
 *   boardId: 'board-789'
 * });
 */

export default {
  initSocket,
  getSocket,
  disconnectSocket
};
