/**
 * =====================================================
 * Comment Controller
 * =====================================================
 * 
 * WHY: Handles comments on tasks for team collaboration.
 * Comments can be added via REST API or Socket.io (for real-time updates).
 */

const Comment = require('../models/commentModel');
const Task = require('../models/taskModel');

/**
 * =====================================================
 * ADD COMMENT TO TASK
 * =====================================================
 * 
 * ENDPOINT: POST /api/tasks/:taskId/comments
 * REQUEST BODY: { text }
 * AUTHENTICATED: Yes
 * 
 * FLOW:
 * 1. Validate comment text
 * 2. Create comment in database
 * 3. Add comment reference to task
 * 4. Return comment with author info
 * 
 * SOCKET.IO ALTERNATIVE:
 * When posted via Socket.io, backend broadcasts 'comment:added'
 * to all users in board room (see socketManager.js)
 */
const addComment = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { text } = req.body;

    // Validate
    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment text is required'
      });
    }

    // Verify task exists
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Create comment with current user as author
    const comment = new Comment({
      text: text.trim(),
      author: req.user.userId,
      task: taskId
    });

    await comment.save();

    // Add comment to task
    task.comments.push(comment._id);
    await task.save();

    // Populate author info before returning
    await comment.populate('author', 'name email');

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      comment
    });

  } catch (error) {
    next(error);
  }
};


/**
 * =====================================================
 * GET ALL COMMENTS FOR TASK
 * =====================================================
 * 
 * ENDPOINT: GET /api/tasks/:taskId/comments
 * 
 * RETURNS: All comments on the task with author info
 */
const getComments = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    // Verify task exists
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Get all comments, sorted newest first
    const comments = await Comment.find({ task: taskId })
      .populate('author', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: comments.length,
      comments
    });

  } catch (error) {
    next(error);
  }
};


/**
 * =====================================================
 * DELETE COMMENT
 * =====================================================
 * 
 * ENDPOINT: DELETE /api/comments/:commentId
 * 
 * CASCADING DELETE:
 * - Delete comment
 * - Remove comment reference from task
 */
const deleteComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Only comment author can delete (could also check board owner)
    if (comment.author.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own comments'
      });
    }

    const taskId = comment.task;

    // Delete comment
    await Comment.findByIdAndDelete(commentId);

    // Remove comment from task
    await Task.findByIdAndUpdate(
      taskId,
      { $pull: { comments: commentId } }
    );

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully'
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  addComment,
  getComments,
  deleteComment
};
