/**
 * =====================================================
 * Board List Component
 * =====================================================
 * 
 * WHY: Shows all user's boards (projects).
 * User selects a board to open Kanban board view.
 * 
 * FEATURES:
 * - List of user's boards
 * - Create new board
 * - Delete board
 * - Navigate to board
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import '../../styles/Board.css';

const BoardList = ({ onSelectBoard, onCreateBoard }) => {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [newBoardDesc, setNewBoardDesc] = useState('');
  const { user } = useAuth();

  /**
   * loadBoards: Fetch all user's boards from backend
   * 
   * WHEN CALLED:
   * - On component mount
   * - After creating new board
   * - After deleting board
   */
  const loadBoards = async () => {
    try {
      setLoading(true);
      setError('');

      // ================================================================
      // API CALL: Get boards
      // ================================================================
      // GET /api/boards returns all boards user owns or is member of
      // Backend handles authorization (won't return boards not accessible)
      const response = await api.getAllBoards();

      if (response.success) {
        setBoards(response.boards);
      }

    } catch (err) {
      setError('Failed to load boards');
      console.error('Load boards error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load boards on component mount
  useEffect(() => {
    loadBoards();
  }, []);

  /**
   * handleCreateBoard: Process new board form
   */
  const handleCreateBoard = async (e) => {
    e.preventDefault();

    if (!newBoardTitle.trim()) {
      setError('Board title is required');
      return;
    }

    try {
      // ================================================================
      // API CALL: Create board
      // ================================================================
      // POST /api/boards creates new board owned by current user
      const response = await api.createBoard(newBoardTitle, newBoardDesc);

      if (response.success) {
        // Add new board to list
        setBoards([response.board, ...boards]);

        // Clear form
        setNewBoardTitle('');
        setNewBoardDesc('');
        setShowCreateForm(false);

        if (onCreateBoard) onCreateBoard(response.board);
      }

    } catch (err) {
      setError('Failed to create board');
      console.error('Create board error:', err);
    }
  };

  /**
   * handleDeleteBoard: Remove board
   */
  const handleDeleteBoard = async (boardId) => {
    if (!confirm('Are you sure? This will delete all tasks on this board.')) {
      return;
    }

    try {
      // ================================================================
      // API CALL: Delete board
      // ================================================================
      // DELETE /api/boards/:id removes board and all its tasks
      await api.deleteBoard(boardId);

      // Remove from UI
      setBoards(boards.filter(b => b._id !== boardId));

    } catch (err) {
      setError('Failed to delete board');
      console.error('Delete board error:', err);
    }
  };

  if (loading) return <div className="loading">Loading boards...</div>;

  return (
    <div className="board-list-container">
      <div className="board-list-header">
        <h2>Your Project Boards</h2>
        <button 
          className="btn-primary"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          + New Board
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* CREATE BOARD FORM */}
      {showCreateForm && (
        <form onSubmit={handleCreateBoard} className="create-board-form">
          <input
            type="text"
            placeholder="Board title"
            value={newBoardTitle}
            onChange={(e) => setNewBoardTitle(e.target.value)}
            autoFocus
          />
          <textarea
            placeholder="Description (optional)"
            value={newBoardDesc}
            onChange={(e) => setNewBoardDesc(e.target.value)}
          />
          <div className="form-actions">
            <button type="submit" className="btn-primary">Create</button>
            <button 
              type="button"
              className="btn-secondary"
              onClick={() => setShowCreateForm(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* BOARDS GRID */}
      {boards.length === 0 ? (
        <div className="empty-state">
          <p>No boards yet. Create one to get started!</p>
        </div>
      ) : (
        <div className="boards-grid">
          {boards.map(board => (
            <div key={board._id} className="board-card">
              <div 
                className="board-card-content"
                onClick={() => onSelectBoard(board)}
              >
                <h3>{board.title}</h3>
                <p className="board-desc">{board.description}</p>
                <p className="board-meta">
                  {board.tasks?.length || 0} tasks | {board.members?.length || 0} members
                </p>
              </div>
              
              <div className="board-card-actions">
                <button
                  className="btn-delete"
                  onClick={() => handleDeleteBoard(board._id)}
                  title="Delete board"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BoardList;
