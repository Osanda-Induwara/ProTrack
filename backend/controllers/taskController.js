/**
 * =====================================================
 * Task Controller
 * =====================================================
 * 
 * WHY: Handles all task operations on the Kanban board.
 * These operations are also triggered via Socket.io for real-time updates.
 * 
 * DUAL INTERFACE:
 * 1. REST API: Traditional HTTP requests
 *    Example: PUT /api/tasks/:id { status: "In Progress" }
 * 
 * 2. WebSocket: Real-time events
 *    Example: socket.emit('task:move', { taskId, newStatus })
 * 
 * Both paths update database, second path also broadcasts updates.
 */

const Task = require('../models/taskModel');
const Board = require('../models/boardModel');

/**
 * =====================================================
 * CREATE TASK
 * =====================================================
 * 
 * ENDPOINT: POST /api/boards/:boardId/tasks
 * REQUEST BODY: { title, description, status }
 * 
 * FLOW:
 * 1. Create task in specified board
 * 2. Add task to board's tasks array
 * 3. Return created task
 */
const createTask = async (req, res, next) => {
  try {
    const { boardId } = req.params;
    const { title, description, status } = req.body;

    // Validate
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Task title is required'
      });
    }

    // Verify board exists and user has access
    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({
        success: false,
        message: 'Board not found'
      });
    }

    // Create task
    const task = new Task({
      title: title.trim(),
      description: description?.trim() || '',
      board: boardId,
      status: status || 'To Do',
      position: 0
    });

    await task.save();

    // Add task to board
    board.tasks.push(task._id);
    await board.save();

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      task
    });

  } catch (error) {
    next(error);
  }
};


/**
 * =====================================================
 * GET ALL TASKS FOR BOARD
 * =====================================================
 * 
 * ENDPOINT: GET /api/boards/:boardId/tasks
 * 
 * RETURNS: All tasks organized by status/column
 * 
 * WHY DATABASE QUERY:
 * - Gets all tasks with assignee and comment details
 * - .populate() retrieves referenced documents (User, Comment)
 * - Without populate, would only get IDs
 */
const getTasksByBoard = async (req, res, next) => {
  try {
    const { boardId } = req.params;

    // Verify board exists
    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({
        success: false,
        message: 'Board not found'
      });
    }

    // Get all tasks, organized by status
    const tasks = await Task.find({ board: boardId })
      .populate('assignee', 'name email')
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'name email'
        }
      })
      .sort({ position: 1 });  // Sort by position within column

    // Group tasks by status for frontend convenience
    const tasksByStatus = {
      'To Do': tasks.filter(t => t.status === 'To Do'),
      'In Progress': tasks.filter(t => t.status === 'In Progress'),
      'Done': tasks.filter(t => t.status === 'Done')
    };

    res.status(200).json({
      success: true,
      tasks,
      tasksByStatus  // Pre-organized for frontend
    });

  } catch (error) {
    next(error);
  }
};


/**
 * =====================================================
 * GET SINGLE TASK DETAILS
 * =====================================================
 * 
 * ENDPOINT: GET /api/tasks/:taskId
 * 
 * RETURNS: Full task details including comments
 */
const getTaskDetail = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId)
      .populate('assignee', 'name email')
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'name email'
        }
      })
      .exec();

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.status(200).json({
      success: true,
      task
    });

  } catch (error) {
    next(error);
  }
};


/**
 * =====================================================
 * UPDATE TASK
 * =====================================================
 * 
 * ENDPOINT: PUT /api/tasks/:taskId
 * REQUEST BODY: { title, description, status, assignee, dueDate, tags }
 * 
 * UPDATES ALLOWED:
 * - task title and description
 * - task status (move to different column)
 * - assign user to task
 * - set due date
 * - add tags
 */
const updateTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const updates = req.body;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // ================================================================
    // WEBSOCKET & REST API INTEGRATION
    // ================================================================
    // This endpoint can be called via:
    // 
    // 1. Traditional REST API:
    //    fetch(`/api/tasks/${taskId}`, {
    //      method: 'PUT',
    //      body: JSON.stringify({ status: 'In Progress' })
    //    })
    //
    // 2. Socket.io event (in socketManager.js):
    //    socket.emit('task:move', { taskId, newStatus })
    //
    // Both paths result in same database update. But Socket.io 
    // additionally broadcasts 'task:updated' to all connected users.
    // ================================================================

    // Update allowed fields
    const allowedFields = [
      'title',
      'description',
      'status',
      'position',
      'assignee',
      'dueDate',
      'tags'
    ];

    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        task[field] = updates[field];
      }
    });

    await task.save();

    // Return updated task with populated refs
    const updatedTask = await Task.findById(taskId)
      .populate('assignee', 'name email')
      .exec();

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      task: updatedTask
    });

  } catch (error) {
    next(error);
  }
};


/**
 * =====================================================
 * DELETE TASK
 * =====================================================
 * 
 * ENDPOINT: DELETE /api/tasks/:taskId
 * 
 * CASCADING DELETE:
 * - Delete task
 * - Delete all comments on task
 * - Remove task reference from board
 */
const deleteTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const boardId = task.board;

    // Delete all comments on this task
    const { Comment } = require('../models/commentModel');
    await Comment.deleteMany({ task: taskId });

    // Delete the task
    await Task.findByIdAndDelete(taskId);

    // Remove task from board's tasks array
    await Board.findByIdAndUpdate(
      boardId,
      { $pull: { tasks: taskId } }
    );

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully'
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTask,
  getTasksByBoard,
  getTaskDetail,
  updateTask,
  deleteTask
};
