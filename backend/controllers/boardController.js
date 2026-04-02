/**
 * =====================================================
 * Board Controller
 * =====================================================
 * 
 * WHY: Handles all board-related operations (Create, Read, Update, Delete).
 * Follows REST API pattern:
 * - POST /api/boards (create)
 * - GET /api/boards (list all)
 * - GET /api/boards/:id (get details)
 * - PUT /api/boards/:id (update)
 * - DELETE /api/boards/:id (delete)
 */

const Board = require('../models/boardModel');
const User = require('../models/userModel');
const Task = require('../models/taskModel');

/**
 * =====================================================
 * CREATE BOARD
 * =====================================================
 * 
 * ENDPOINT: POST /api/boards
 * REQUEST BODY: { title, description }
 * AUTHENTICATED: Yes (requires valid JWT)
 * 
 * FLOW:
 * 1. Get current user from protect middleware (req.user)
 * 2. Create new board with this user as owner
 * 3. Add board to user's boards array
 * 4. Return created board
 * 
 * WHY save user:
 * - user.boards array is a reference to board _id
 * - When user wants to see "My Boards", we fetch user.boards
 * - This relationship makes queries fast
 */
const createBoard = async (req, res, next) => {
  try {
    const { title, description } = req.body;

    // Validation
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Board title is required'
      });
    }

    // Create board owned by current user
    const board = new Board({
      title: title.trim(),
      description: description?.trim() || '',
      owner: req.user.userId,
      members: [req.user.userId],  // Owner is first member
      columns: ['To Do', 'In Progress', 'Done']
    });

    await board.save();

    // Add board reference to user's boards array
    await User.findByIdAndUpdate(
      req.user.userId,
      { $push: { boards: board._id } },
      { new: true }
    );

    res.status(201).json({
      success: true,
      message: 'Board created successfully',
      board: {
        id: board._id,
        title: board.title,
        description: board.description,
        owner: board.owner,
        members: board.members,
        columns: board.columns,
        createdAt: board.createdAt
      }
    });

  } catch (error) {
    next(error);
  }
};


/**
 * =====================================================
 * GET ALL BOARDS FOR USER
 * =====================================================
 * 
 * ENDPOINT: GET /api/boards
 * AUTHENTICATED: Yes
 * 
 * RETURNS: All boards where user is owner or member
 */
const getAllBoards = async (req, res, next) => {
  try {
    // Find boards where user is owner or member
    const boards = await Board.find({
      $or: [
        { owner: req.user.userId },
        { members: req.user.userId }
      ]
    })
    .populate('owner', 'name email')
    .populate('members', 'name email')
    .sort({ createdAt: -1 });  // Newest first

    res.status(200).json({
      success: true,
      count: boards.length,
      boards
    });

  } catch (error) {
    next(error);
  }
};


/**
 * =====================================================
 * GET BOARD DETAILS
 * =====================================================
 * 
 * ENDPOINT: GET /api/boards/:boardId
 * AUTHENTICATED: Yes
 * 
 * RETURNS: Board with all tasks populated
 */
const getBoardDetail = async (req, res, next) => {
  try {
    const { boardId } = req.params;

    const board = await Board.findById(boardId)
      .populate('owner', 'name email')
      .populate('members', 'name email')
      .populate({
        path: 'tasks',
        populate: [
          { path: 'assignee', select: 'name email' },
          { path: 'comments' }
        ]
      })
      .exec();

    if (!board) {
      return res.status(404).json({
        success: false,
        message: 'Board not found'
      });
    }

    // Check if current user has access
    const hasAccess = 
      board.owner._id.toString() === req.user.userId ||
      board.members.some(m => m._id.toString() === req.user.userId);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this board'
      });
    }

    res.status(200).json({
      success: true,
      board
    });

  } catch (error) {
    next(error);
  }
};


/**
 * =====================================================
 * UPDATE BOARD
 * =====================================================
 * 
 * ENDPOINT: PUT /api/boards/:boardId
 * AUTHENTICATED: Yes
 * 
 * Only board owner can update board details
 */
const updateBoard = async (req, res, next) => {
  try {
    const { boardId } = req.params;
    const { title, description, columns } = req.body;

    const board = await Board.findById(boardId);

    if (!board) {
      return res.status(404).json({
        success: false,
        message: 'Board not found'
      });
    }

    // Only owner can update
    if (board.owner.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Only board owner can update the board'
      });
    }

    // Update allowed fields
    if (title) board.title = title;
    if (description) board.description = description;
    if (columns && Array.isArray(columns)) board.columns = columns;

    await board.save();

    res.status(200).json({
      success: true,
      message: 'Board updated successfully',
      board
    });

  } catch (error) {
    next(error);
  }
};


/**
 * =====================================================
 * DELETE BOARD
 * =====================================================
 * 
 * ENDPOINT: DELETE /api/boards/:boardId
 * AUTHENTICATED: Yes
 * 
 * CASCADING DELETE:
 * - Delete board
 * - Delete all tasks in board
 * - Remove board reference from user
 */
const deleteBoard = async (req, res, next) => {
  try {
    const { boardId } = req.params;

    const board = await Board.findById(boardId);

    if (!board) {
      return res.status(404).json({
        success: false,
        message: 'Board not found'
      });
    }

    // Only owner can delete
    if (board.owner.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Only board owner can delete the board'
      });
    }

    // Delete all tasks in this board (cascade delete)
    await Task.deleteMany({ board: boardId });

    // Delete the board
    await Board.findByIdAndDelete(boardId);

    // Remove board from user's boards array
    await User.findByIdAndUpdate(
      req.user.userId,
      { $pull: { boards: boardId } }
    );

    res.status(200).json({
      success: true,
      message: 'Board deleted successfully'
    });

  } catch (error) {
    next(error);
  }
};


/**
 * =====================================================
 * ADD MEMBER TO BOARD
 * =====================================================
 * 
 * ENDPOINT: POST /api/boards/:boardId/members
 * REQUEST BODY: { userId }
 * 
 * Allows board owner to invite other users
 */
const addMember = async (req, res, next) => {
  try {
    const { boardId } = req.params;
    const { userId } = req.body;

    const board = await Board.findById(boardId);

    if (!board) {
      return res.status(404).json({
        success: false,
        message: 'Board not found'
      });
    }

    // Check ownership
    if (board.owner.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Only board owner can add members'
      });
    }

    // Check if already member
    if (board.members.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member'
      });
    }

    // Add member
    board.members.push(userId);
    await board.save();

    // Add board to user's boards (so they see it in their list)
    await User.findByIdAndUpdate(userId, { $push: { boards: boardId } });

    res.status(200).json({
      success: true,
      message: 'Member added successfully',
      board
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBoard,
  getAllBoards,
  getBoardDetail,
  updateBoard,
  deleteBoard,
  addMember
};
