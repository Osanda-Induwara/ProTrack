/**
 * =====================================================
 * Comment Model (MongoDB Schema)
 * =====================================================
 * 
 * WHY: Defines the structure of comments on tasks.
 * Enables team collaboration with real-time comment updates via Socket.io
 * 
 * FEATURES:
 * - Belongs to a task
 * - Author information
 * - Real-time updates through Socket.io
 */

const mongoose = require('mongoose');

/**
 * commentSchema: Defines the structure of a Comment document
 * 
 * FIELDS:
 * - text: The comment content
 * - author: Reference to User who wrote the comment
 * - task: Reference to parent Task
 * - createdAt: When comment was posted
 */
const commentSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, 'Comment text is required'],
    trim: true,
    maxlength: [500, 'Comment cannot exceed 500 characters']
  },

  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

/**
 * INDEX: Optimize queries by task
 * 
 * WHY:
 * - When loading a task, we fetch all its comments
 * - Index on task field speeds up this lookup
 */
commentSchema.index({ task: 1, createdAt: -1 });  // Sort newest first

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;
