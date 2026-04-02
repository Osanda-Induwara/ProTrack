/**
 * =====================================================
 * Task Model (MongoDB Schema)
 * =====================================================
 * 
 * WHY: Defines the structure of a Task (card) document.
 * Tasks are moved between columns on the Kanban board.
 * 
 * FEATURES:
 * - Belongs to a board
 * - Assigned to users
 * - Has due dates and tags
 * - Tracks position/order in columns
 */

const mongoose = require('mongoose');

/**
 * taskSchema: Defines the structure of a Task document
 * 
 * FIELDS:
 * - title: Task name
 * - description: Task details
 * - board: Reference to parent Board
 * - status: Current column (To Do, In Progress, Done)
 * - position: Order within the column (for drag-drop)
 * - assignee: User assigned to this task
 * - dueDate: When task should be completed
 * - tags: Labels for categorization
 * - comments: Array of comment IDs
 */
const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },

  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },

  board: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Board',
    required: true
  },

  status: {
    type: String,
    enum: ['To Do', 'In Progress', 'Done'],
    default: 'To Do',
    // WHY enum: Restricts to valid column names, prevents typos
  },

  position: {
    type: Number,
    default: 0
    // WHY: Used to maintain order of tasks in a column
    // When user drags task, position is updated
  },

  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null  // Task can be unassigned initially
  },

  dueDate: {
    type: Date,
    default: null
  },

  tags: [
    {
      type: String,
      trim: true
      // WHY Array: Task can have multiple tags (Bug, Feature, Urgent, etc.)
    }
  ],

  comments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment'
    }
  ],

  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
});

/**
 * PRE-SAVE HOOK: Update updatedAt timestamp
 */
taskSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

/**
 * INDEXES: Optimize query performance
 * 
 * WHY Multi-field index:
 * - Frequently query tasks by board AND status
 * - Example: "Get all 'In Progress' tasks for a board"
 * - Index speeds up this compound query significantly
 */
taskSchema.index({ board: 1, status: 1 });

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
