/**
 * =====================================================
 * Comment Routes
 * =====================================================
 * 
 * Team comments and discussion on tasks.
 * Comments also available via Socket.io for instant updates.
 */

const express = require('express');
const router = express.Router();
const {
  addComment,
  getComments,
  deleteComment
} = require('../controllers/commentController');
const { protect } = require('../middlewares/authMiddleware');

// All comment routes require authentication
router.use(protect);

/**
 * POST /api/tasks/:taskId/comments
 * 
 * Add comment to task
 * Body: { text }
 * Returns: { success, comment }
 * 
 * ALSO AVAILABLE VIA SOCKET.IO:
 * socket.emit('comment:add', { taskId, text, userId })
 * 
 * Socket.io version broadcasts 'comment:added' to all users
 * REST API version requires client to refetch comments
 */
router.post('/:taskId/comments', addComment);

/**
 * GET /api/tasks/:taskId/comments
 * 
 * Get all comments for a task
 * Returns: Array of comments with author info
 * 
 * FRONTEND USAGE:
 * Fetch when opening task detail modal
 * Display in comments section
 */
router.get('/:taskId/comments', getComments);

/**
 * DELETE /api/comments/:commentId
 * 
 * Delete comment
 * Returns: { success, message }
 * 
 * AUTHORIZATION:
 * Only comment author can delete
 */
router.delete('/comments/:commentId', deleteComment);

module.exports = router;
