/**
 * =====================================================
 * Socket.io Event Manager
 * =====================================================
 * 
 * WHY: Manages all real-time events through Socket.io.
 * This is where WebSocket events are defined and handled.
 * 
 * REAL-TIME WORKFLOW EXAMPLE:
 * ============================
 * 
 * User A moves a task from "To Do" to "In Progress":
 * 
 * 1. React Frontend:
 *    - User drags task card on Kanban board
 *    - Local state updates immediately (optimistic UI)
 *    - Emits Socket.io event: socket.emit('task:move', { taskId, newStatus })
 * 
 * 2. Backend receives event:
 *    - Validates the action in updateTaskStatus()
 *    - Updates MongoDB database
 *    - Broadcasts to all other users in the board room
 * 
 * 3. Other users' frontends:
 *    - Receive the 'task:updated' event via Socket.io
 *    - Update their local React state
 *    - UI re-renders with new task position
 *    - NO PAGE REFRESH needed!
 * 
 * This creates the real-time collaborative experience.
 */

const User = require('../models/userModel');
const Task = require('../models/taskModel');
const Comment = require('../models/commentModel');

/**
 * setupSocketEvents: Initializes all Socket.io event listeners
 * 
 * PARAMETERS:
 * - io: Socket.io server instance
 * - socket: Individual client connection
 * 
 * STRUCTURE:
 * - socket.on('event-name', async (data, callback) => { ... })
 * - Each event can communicate with database
 * - Broadcasts updates to other connected users
 */
const setupSocketEvents = (io, socket) => {
  console.log(`📱 User connected: ${socket.id}`);

  /**
   * =====================================================
   * ROOM MANAGEMENT EVENTS
   * =====================================================
   * 
   * Rooms group users viewing the same board.
   * Only users in the same room receive updates.
   * This prevents unrelated users from seeing updates.
   */

  /**
   * EVENT: user:join-board
   * WHEN: User opens a board (loads Kanban view)
   * WHAT: Client sends boardId, backend adds socket to that room
   * 
   * Socket.io ROOMS explained:
   * - socket.join('board-123') - Adds this socket to room
   * - io.to('board-123').emit() - Sends to all sockets in room
   * - Perfect for scaling: each board is its own room
   */
  socket.on('user:join-board', async (data) => {
    try {
      const { boardId, userId } = data;
      
      // Join Socket.io room (similar to a chat channel)
      socket.join(`board-${boardId}`);
      
      // Optionally update database with online status
      // This could be used for "User X is viewing this board"
      
      console.log(`✅ User ${userId} joined board room: board-${boardId}`);
      
      // Notify all users in this board that someone joined
      io.to(`board-${boardId}`).emit('user:joined-board', {
        userId,
        message: `User joined the board`
      });
    } catch (error) {
      console.error('Error joining board:', error.message);
      socket.emit('error', { message: 'Failed to join board' });
    }
  });

  /**
   * EVENT: user:leave-board
   * WHEN: User navigates away from board
   * WHAT: Remove user from room, update others
   */
  socket.on('user:leave-board', (data) => {
    const { boardId, userId } = data;
    socket.leave(`board-${boardId}`);
    
    io.to(`board-${boardId}`).emit('user:left-board', {
      userId,
      message: `User left the board`
    });
  });


  /**
   * =====================================================
   * TASK DRAG-AND-DROP EVENTS
   * =====================================================
   * 
   * These events handle Kanban board interactions.
   * When a task is moved or updated, ALL users see it instantly.
   */

  /**
   * EVENT: task:move
   * WHEN: User drags a task from one column to another
   * FLOW: 
   *   Client -> Emit task:move -> Backend validates & updates DB 
   *   -> Broadcast task:updated to all users in board room
   * 
   * WHY Database update needed:
   * - Persistence: Task position saved even after refresh
   * - Other users: Can see the change on their screens
   * - Conflict resolution: If two users move same task, DB decides
   */
  socket.on('task:move', async (data) => {
    try {
      const { taskId, newStatus, newPosition, boardId } = data;

      // Validate task exists and belongs to this board
      const task = await Task.findOne({ _id: taskId, board: boardId });
      
      if (!task) {
        socket.emit('error', { message: 'Task not found' });
        return;
      }

      // Update task in database
      task.status = newStatus;
      task.position = newPosition;
      await task.save();

      // ===============================================================
      // WEBSOCKET → REST API INTEGRATION:
      // ===============================================================
      // This Socket.io event updates the database (same as the 
      // REST PUT endpoint would do). Both paths result in the same 
      // database update.
      //
      // REST API PATH (if user moved task via HTTP request):
      //   PUT /api/tasks/:id { status, position }
      //
      // SOCKET.IO PATH (user moves task in real-time UI):
      //   socket.emit('task:move', { taskId, newStatus, newPosition })
      //
      // RESULT: Same database change, but Socket.io version is faster
      //         and broadcasts to all users immediately.
      // ===============================================================

      // Broadcast the update to all users in this board room
      // This triggers the other clients to update their UI
      io.to(`board-${boardId}`).emit('task:updated', {
        taskId,
        status: newStatus,
        position: newPosition,
        message: `Task moved to ${newStatus}`
      });

      console.log(`📦 Task ${taskId} moved to ${newStatus}`);

    } catch (error) {
      console.error('Error moving task:', error.message);
      socket.emit('error', { message: 'Failed to move task' });
    }
  });

  /**
   * EVENT: task:update
   * WHEN: User edits task details (title, description, assignee, etc)
   * WHAT: Update task in database and broadcast to all users
   */
  socket.on('task:update', async (data) => {
    try {
      const { taskId, boardId, updates } = data;
      
      const task = await Task.findOne({ _id: taskId, board: boardId });
      if (!task) {
        socket.emit('error', { message: 'Task not found' });
        return;
      }

      // Update allowed fields (prevent unauthorized field changes)
      const allowedFields = ['title', 'description', 'assignee', 'dueDate', 'tags'];
      allowedFields.forEach(field => {
        if (updates[field] !== undefined) {
          task[field] = updates[field];
        }
      });

      await task.save();

      // Broadcast update to all users viewing this board
      io.to(`board-${boardId}`).emit('task:updated-details', {
        taskId,
        updates,
        message: 'Task details updated'
      });

    } catch (error) {
      console.error('Error updating task:', error.message);
      socket.emit('error', { message: 'Failed to update task' });
    }
  });


  /**
   * =====================================================
   * COMMENT/CHAT EVENTS
   * =====================================================
   * 
   * Real-time team comments on tasks.
   * Comments appear instantly for all team members.
   */

  /**
   * EVENT: comment:add
   * WHEN: User types a comment on a task and presses Enter
   * FLOW: Create comment in DB -> Broadcast to all task viewers
   */
  socket.on('comment:add', async (data) => {
    try {
      const { taskId, text, userId, boardId } = data;

      // Create comment in database
      const comment = new Comment({
        text,
        author: userId,
        task: taskId
      });

      await comment.save();

      // Populate author info before broadcasting
      await comment.populate('author', 'name email');

      // ===============================================================
      // WEBSOCKET → REST API INTEGRATION:
      // ===============================================================
      // This Socket.io event creates a comment (same as:
      //   POST /api/tasks/:taskId/comments { text }
      //
      // EVENT-DRIVEN UPDATES:
      // REST API: Client polls or manually refreshes for new comments
      // Socket.io: Instant update via WebSocket, all users see it
      //
      // When comment is added:
      // 1. Event listener executes (creates in DB)
      // 2. Broadcasts 'comment:added' to all users in board room
      // 3. Users' React components listen for this event
      // 4. State updates automatically
      // 5. Component re-renders with new comment
      // ===============================================================

      // Tell all users in this board that a comment was added
      io.to(`board-${boardId}`).emit('comment:added', {
        taskId,
        comment: {
          _id: comment._id,
          text: comment.text,
          author: comment.author,
          createdAt: comment.createdAt
        }
      });

      socket.emit('comment:success', { commentId: comment._id });

    } catch (error) {
      console.error('Error adding comment:', error.message);
      socket.emit('error', { message: 'Failed to add comment' });
    }
  });


  /**
   * =====================================================
   * CONNECTION/DISCONNECTION EVENTS
   * =====================================================
   */

  /**
   * EVENT: disconnect
   * WHEN: User closes app, loses connection, or logs out
   * WHAT: Clean up user's socket
   */
  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.id}`);
  });

};

module.exports = { setupSocketEvents };
