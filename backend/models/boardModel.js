/**
 * =====================================================
 * Board Model (MongoDB Schema)
 * =====================================================
 * 
 * WHY: Defines the structure of a Board (project) document.
 * A board is like a project container that holds multiple tasks in columns.
 * 
 * FEATURES:
 * - Belongs to a user (owner)
 * - Has multiple columns (To Do, In Progress, Done)
 * - Tracks collaborators
 */

const mongoose = require('mongoose');

/**
 * boardSchema: Defines the structure of a Board document
 * 
 * FIELDS:
 * - title: Name of the project board
 * - description: Details about the board
 * - owner: Reference to the User who created this board
 * - members: Array of users who can access this board
 * - columns: Array of column definitions (To Do, In Progress, Done)
 * - tasks: Array of Task IDs in this board
 */
const boardSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Board title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },

  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },

  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],

  // Kanban columns - Pre-defined columns for task organization
  columns: {
    type: Array,
    default: ['To Do', 'In Progress', 'Done'],
    // WHY Array: Allows flexibility to customize columns per board
  },

  tasks: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task'
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
 * PRE-SAVE HOOK: Update the updatedAt timestamp
 * 
 * WHY NEEDED:
 * - Tracks when board was last modified
 * - Useful for sorting, filtering, and audit trails
 */
boardSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

/**
 * INDEX: Improve query performance
 * 
 * WHY:
 * - Boards are frequently queried by owner
 * - Without index, MongoDB scans entire collection
 * - Index speeds up lookups like finding all boards for a user
 */
boardSchema.index({ owner: 1 });

const Board = mongoose.model('Board', boardSchema);

module.exports = Board;
