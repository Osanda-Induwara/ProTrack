/**
 * =====================================================
 * Task Modal Component (Task Detail View)
 * =====================================================
 * 
 * WHY: Detailed task view when user clicks on a task card.
 * Shows and allows editing of:
 * - Title and description
 * - Assignee
 * - Due date
 * - Tags
 * - Comments (with real-time updates)
 * 
 * FEATURES:
 * - Edit task details
 * - Assign to team member
 * - Set due date
 * - Add/view/delete comments
 * - Real-time comment sync with Socket.io
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import CommentSection from '../Comments/CommentSection';
import '../../styles/TaskModal.css';

const TaskModal = ({ task, board, onClose, onUpdate, onDelete }) => {
  const [editMode, setEditMode] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [assignee, setAssignee] = useState(task.assignee?._id || '');
  const [dueDate, setDueDate] = useState(task.dueDate ? task.dueDate.slice(0, 10) : '');
  const [tags, setTags] = useState(task.tags?.join(', ') || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  /**
   * handleSave: Save task changes to database
   * 
   * WHEN CALLED: User clicks Save in edit mode
   * 
   * FLOW:
   * 1. Validate inputs
   * 2. Call API to update task
   * 3. Update local state
   * 4. Broadcast via Socket.io to other users
   * 5. Exit edit mode
   */
  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Parse tags from comma-separated string
      const tagsArray = tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t);

      // ================================================================
      // API CALL: Update task
      // ================================================================
      // PUT /api/tasks/:id { title, description, assignee, dueDate, tags }
      const response = await api.updateTask(task._id, {
        title: title.trim(),
        description: description.trim(),
        assignee: assignee || null,
        dueDate: dueDate || null,
        tags: tagsArray
      });

      if (response.success) {
        // ================================================================
        // WEBSOCKET BROADCAST
        // ================================================================
        // Notify other users viewing this board of the update
        const socket = getSocket();
        socket.emit('task:update', {
          taskId: task._id,
          boardId: board._id,
          updates: {
            title: title.trim(),
            description: description.trim(),
            assignee: assignee || null,
            dueDate: dueDate || null,
            tags: tagsArray
          }
        });

        // Update parent component state
        onUpdate(response.task);

        // Exit edit mode
        setEditMode(false);
      }

    } catch (err) {
      // Extract detailed error message from API response
      let errorMessage = 'Failed to save task';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      if (err.response?.data?.errors) {
        // If multiple validation errors, join them
        const errors = Array.isArray(err.response.data.errors) 
          ? err.response.data.errors.join(', ')
          : err.response.data.errors;
        errorMessage = `Validation Error: ${errors}`;
      }
      
      setError(errorMessage);
      console.error('Save task error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * handleDelete: Remove task
   */
  const handleDelete = async () => {
    if (!confirm('Delete this task? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);

      // ================================================================
      // API CALL: Delete task
      // ================================================================
      // DELETE /api/tasks/:id
      await api.deleteTask(task._id);

      // Notify parent component
      onDelete(task._id);
      onClose();

    } catch (err) {
      setError('Failed to delete task');
      console.error('Delete task error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="modal-header">
          <div className="modal-header-content">
            {editMode ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="task-title-input"
              />
            ) : (
              <h2>{task.title}</h2>
            )}
            <p className="task-status">Status: <strong>{task.status}</strong></p>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* MAIN CONTENT */}
        <div className="modal-body">
          <div className="task-details">
            {/* DESCRIPTION */}
            <section>
              <h3>Description</h3>
              {editMode ? (
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add description..."
                />
              ) : (
                <p>{description || 'No description'}</p>
              )}
            </section>

            {/* ASSIGNEE */}
            <section>
              <h3>Assigned To</h3>
              {editMode ? (
                <select
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {board.members?.map(member => (
                    <option key={member._id} value={member._id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              ) : (
                <p>{task.assignee?.name || 'Unassigned'}</p>
              )}
            </section>

            {/* DUE DATE */}
            <section>
              <h3>Due Date</h3>
              {editMode ? (
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              ) : (
                <p>
                  {task.dueDate
                    ? new Date(task.dueDate).toLocaleDateString()
                    : 'No due date'}
                </p>
              )}
            </section>

            {/* TAGS */}
            <section>
              <h3>Tags</h3>
              {editMode ? (
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Separate tags with commas"
                />
              ) : (
                <div className="task-tags">
                  {task.tags?.map((tag, idx) => (
                    <span key={idx} className="tag">{tag}</span>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* COMMENTS SECTION */}
          <CommentSection taskId={task._id} board={board} />
        </div>

        {/* FOOTER */}
        <div className="modal-footer">
          {editMode ? (
            <>
              <button
                className="btn-primary"
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                className="btn-secondary"
                onClick={() => setEditMode(false)}
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                className="btn-primary"
                onClick={() => setEditMode(true)}
              >
                Edit
              </button>
              <button
                className="btn-delete"
                onClick={handleDelete}
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
