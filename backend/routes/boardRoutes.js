/**
 * =====================================================
 * Board Routes
 * =====================================================
 * 
 * All routes protected by JWT authentication.
 * Users can only access boards they own or are members of.
 */

const express = require('express');
const router = express.Router();
const {
  createBoard,
  getAllBoards,
  getBoardDetail,
  updateBoard,
  deleteBoard,
  addMember
} = require('../controllers/boardController');
const { protect } = require('../middlewares/authMiddleware');

// All board routes require authentication
router.use(protect);

/**
 * POST /api/boards
 * 
 * Create new board
 * Body: { title, description }
 * Returns: { success, board }
 * 
 * BOARD OWNERSHIP:
 * - Current user becomes owner
 * - Only owner can:
 *   - Delete board
 *   - Change columns
 *   - Add/remove members
 */
router.post('/', createBoard);

/**
 * GET /api/boards
 * 
 * Get all boards for current user
 * Returns: User's owned boards + boards they're member of
 */
router.get('/', getAllBoards);

/**
 * GET /api/boards/:boardId
 * 
 * Get single board with all tasks and members
 * Returns: Board with populated tasks, members
 */
router.get('/:boardId', getBoardDetail);

/**
 * PUT /api/boards/:boardId
 * 
 * Update board (title, description, columns)
 * Body: { title?, description?, columns? }
 * Returns: { success, board }
 */
router.put('/:boardId', updateBoard);

/**
 * DELETE /api/boards/:boardId
 * 
 * Delete board (cascades: deletes all tasks too)
 * Returns: { success, message }
 */
router.delete('/:boardId', deleteBoard);

/**
 * POST /api/boards/:boardId/members
 * 
 * Add user to board
 * Body: { userId }
 * Returns: { success, board }
 */
router.post('/:boardId/members', addMember);

module.exports = router;
