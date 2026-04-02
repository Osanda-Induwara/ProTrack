/**
 * =====================================================
 * Task Routes
 * =====================================================
 * 
 * All task operations for Kanban board.
 * Also triggered via Socket.io for real-time updates.
 */

const express = require('express');
const router = express.Router();
const {
  createTask,
  getTasksByBoard,
  getTaskDetail,
  updateTask,
  deleteTask
} = require('../controllers/taskController');
const { protect } = require('../middlewares/authMiddleware');

// All task routes require authentication
router.use(protect);

/**
 * POST /api/boards/:boardId/tasks
 * 
 * Create new task in board
 * Body: { title, description, status }
 * Returns: { success, task }
 */
router.post('/boards/:boardId/tasks', createTask);

/**
 * GET /api/boards/:boardId/tasks
 * 
 * Get all tasks for a board
 * Returns: All tasks organized by status
 * 
 * RESPONSE INCLUDES:
 * - tasks: Array of all tasks
 * - tasksByStatus: Object with tasks grouped by column
 * 
 * FRONTEND USAGE:
 * Fetch when loading Kanban board
 * Use tasksByStatus for rendering columns
 */
router.get('/boards/:boardId/tasks', getTasksByBoard);

/**
 * GET /api/tasks/:taskId
 * 
 * Get single task details
 * Returns: Task with assignee and all comments
 * 
 * FRONTEND USAGE:
 * Fetch when user clicks on a task card
 * Display in task detail modal
 */
router.get('/:taskId', getTaskDetail);

/**
 * PUT /api/tasks/:taskId
 * 
 * Update task (move, assign, edit details)
 * Body: {
 *   title?, 
 *   description?, 
 *   status?,      // Change column
 *   position?,    // Order in column
 *   assignee?,    // Assign to user
 *   dueDate?,     // Set deadline
 *   tags?         // Add labels
 * }
 * Returns: { success, task }
 * 
 * ALSO AVAILABLE VIA SOCKET.IO:
 * socket.emit('task:move', { taskId, newStatus })
 * socket.emit('task:update', { taskId, updates })
 */
router.put('/:taskId', updateTask);

/**
 * DELETE /api/tasks/:taskId
 * 
 * Delete task
 * Returns: { success, message }
 */
router.delete('/:taskId', deleteTask);

module.exports = router;
