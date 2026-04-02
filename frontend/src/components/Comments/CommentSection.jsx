/**
 * =====================================================
 * Comment Section Component
 * =====================================================
 * 
 * WHY: Team collaboration on tasks.
 * Allows adding comments and viewing discussion.
 * 
 * REAL-TIME FEATURES:
 * - Add comment via REST API
 * - Receive new comments via Socket.io instantly
 * - Delete own comments
 * - See comment author and timestamp
 * 
 * SOCKET.IO INTEGRATION:
 * - Listens to 'comment:added' events
 * - Updates UI immediately when comments arrive
 * - No page refresh needed
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import '../../styles/Comments.css';

const CommentSection = ({ taskId, board }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  /**
   * loadComments: Fetch all comments for this task
   * 
   * WHEN CALLED:
   * - On component mount
   * - After new comment added
   */
  const loadComments = async () => {
    try {
      setLoading(true);

      // ================================================================
      // API CALL: Get comments
      // ================================================================
      // GET /api/comments/:taskId/comments
      const response = await api.getComments(taskId);

      if (response.success) {
        setComments(response.comments);
      }

    } catch (err) {
      console.error('Load comments error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * WEBSOCKET SETUP: Listen for real-time comments
   * 
   * When ANY user adds comment, all users see it instantly.
   * No polling, no manual refresh needed.
   */
  useEffect(() => {
    loadComments();

    // Get Socket.io connection
    const socket = getSocket();
    if (!socket) return;

    // ================================================================
    // LISTEN FOR NEW COMMENTS
    // ================================================================
    // When another user posts comment, this event fires
    // Add comment to local state for instant UI update
    socket.on('comment:added', (data) => {
      console.log('💬 New comment received:', data);

      // Only add if comment is for this task
      if (data.taskId === taskId) {
        setComments(prev => [data.comment, ...prev]);
      }
    });

    // CLEANUP
    return () => {
      socket.off('comment:added');
    };
  }, [taskId]);

  /**
   * handleAddComment: Post new comment
   * 
   * FLOW:
   * 1. Validate comment text
   * 2. Call API to save comment
   * 3. Emit Socket.io event
   * 4. All users in board room receive update
   * 5. UI updates instantly
   */
  const handleAddComment = async (e) => {
    e.preventDefault();

    if (!newComment.trim()) {
      setError('Comment cannot be empty');
      return;
    }

    setError('');

    try {
      // ================================================================
      // REST API CALL
      // ================================================================
      // POST /api/comments/:taskId/comments { text }
      // Creates comment in database
      const response = await api.addComment(taskId, newComment);

      if (response.success) {
        // ================================================================
        // WEBSOCKET BROADCAST
        // ================================================================
        // Emit Socket.io event for real-time sync
        // See socketManager.js for backend handler
        const socket = getSocket();
        socket.emit('comment:add', {
          taskId,
          text: newComment,
          userId: user.id,
          boardId: board._id
        });

        // Clear form
        setNewComment('');

        // Reload comments
        loadComments();
      }

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add comment');
      console.error('Add comment error:', err);
    }
  };

  /**
   * handleDeleteComment: Remove comment
   */
  const handleDeleteComment = async (commentId) => {
    if (!confirm('Delete this comment?')) {
      return;
    }

    try {
      // ================================================================
      // API CALL: Delete comment
      // ================================================================
      // DELETE /api/comments/:commentId
      await api.deleteComment(commentId);

      // Remove from local state
      setComments(prev => prev.filter(c => c._id !== commentId));

    } catch (err) {
      setError('Failed to delete comment');
      console.error('Delete comment error:', err);
    }
  };

  return (
    <div className="comment-section">
      <h3>Comments ({comments.length})</h3>

      {error && <div className="error-message">{error}</div>}

      {/* ADD COMMENT FORM */}
      <form onSubmit={handleAddComment} className="add-comment-form">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          rows="2"
        />
        <button type="submit" className="btn-primary">Post Comment</button>
      </form>

      {/* COMMENTS LIST */}
      <div className="comments-list">
        {loading ? (
          <p>Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="no-comments">No comments yet. Be the first to comment!</p>
        ) : (
          comments.map(comment => (
            <div key={comment._id} className="comment">
              <div className="comment-header">
                <strong>{comment.author.name}</strong>
                <span className="comment-date">
                  {new Date(comment.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="comment-text">{comment.text}</p>
              {comment.author._id === user.id && (
                <button
                  className="btn-delete-small"
                  onClick={() => handleDeleteComment(comment._id)}
                >
                  Delete
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommentSection;
