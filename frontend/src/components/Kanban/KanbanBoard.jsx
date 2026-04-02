/**
 * =====================================================
 * Kanban Board Component (Main Board View)
 * =====================================================
 * 
 * WHY: The core feature - drag-and-drop task management.
 * Displays tasks in columns (To Do, In Progress, Done).
 * 
 * REAL-TIME WORKFLOW:
 * 1. User drags task from To Do → In Progress (optimistic UI update)
 * 2. Socket.io event sent: socket.emit('task:move', {...})
 * 3. Backend updates database
 * 4. Backend broadcasts to all connected users
 * 5. Other users' UIs update automatically (WebSocket event)
 * 6. NO PAGE REFRESH needed!
 * 
 * FEATURES:
 * - Drag-and-drop between columns
 * - Task creation
 * - Click to open task details modal
 * - Real-time collaboration via Socket.io
 * - Comment notifications
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import TaskCard from './TaskCard';
import Column from './Column';
import TaskModal from '../TaskModal/TaskModal';
import CommentSection from '../Comments/CommentSection';
import '../../styles/Kanban.css';

const KanbanBoard = ({ board, onBack }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [draggedTask, setDraggedTask] = useState(null);
  const { user } = useAuth();

  /**
   * loadTasks: Fetch all tasks for this board
   * 
   * WHEN CALLED:
   * - On component mount
   * - After creating new task
   * - After real-time update from Socket.io
   */
  const loadTasks = async () => {
    try {
      setLoading(true);

      // ================================================================
      // API CALL: Get all tasks
      // ================================================================
      // GET /api/boards/:boardId/tasks
      // Returns all tasks organized by status/column
      const response = await api.getTasksByBoard(board._id);

      if (response.success) {
        setTasks(response.tasks);
      }

    } catch (err) {
      setError('Failed to load tasks');
      console.error('Load tasks error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * WEBSOCKET SETUP: Listen to real-time events
   * 
   * This is CRUCIAL for real-time collaboration.
   * When ANY user moves a task, all users see it instantly.
   */
  useEffect(() => {
    loadTasks();

    // Get Socket.io connection
    const socket = getSocket();
    if (!socket) return;

    // ================================================================
    // JOIN BOARD ROOM
    // ================================================================
    // Tell server that this user is viewing this board
    // This groups all users viewing same board together
    socket.emit('user:join-board', {
      boardId: board._id,
      userId: user.id
    });

    // ================================================================
    // LISTEN FOR TASK UPDATES
    // ================================================================
    // When another user (or this user) moves a task
    socket.on('task:updated', (data) => {
      console.log('📦 Task updated:', data);

      // Update local state to re-render board
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task._id === data.taskId
            ? { ...task, status: data.status, position: data.position }
            : task
        )
      );
    });

    // Listen for detailed task updates
    socket.on('task:updated-details', (data) => {
      console.log('📝 Task details updated:', data);

      setTasks(prevTasks =>
        prevTasks.map(task =>
          task._id === data.taskId
            ? { ...task, ...data.updates }
            : task
        )
      );
    });

    // CLEANUP: Leave room when component unmounts
    return () => {
      socket.emit('user:leave-board', {
        boardId: board._id,
        userId: user.id
      });

      // Remove event listeners
      socket.off('task:updated');
      socket.off('task:updated-details');
    };
  }, [board._id, user.id]);

  /**
   * handleCreateTask: Add new task to board
   */
  const handleCreateTask = async (e) => {
    e.preventDefault();

    if (!newTaskTitle.trim()) {
      setError('Task title is required');
      return;
    }

    try {
      // ================================================================
      // API CALL: Create task
      // ================================================================
      // POST /api/boards/:boardId/tasks
      // Creates new task in "To Do" column
      const response = await api.createTask(
        board._id,
        newTaskTitle,
        '',
        'To Do'
      );

      if (response.success) {
        // Add to local state (instant UI update)
        setTasks([...tasks, response.task]);
        setNewTaskTitle('');
      }

    } catch (err) {
      setError('Failed to create task');
      console.error('Create task error:', err);
    }
  };

  /**
   * handleDragStart: User starts dragging task
   * 
   * WHY SEPARATE:
   * - Store reference to dragged task
   * - Used in drop handler to know what to move
   */
  const handleDragStart = (task) => {
    setDraggedTask(task);
  };

  /**
   * handleDragOver: Allow dropping on columns
   * 
   * WHY NEEDED:
   * - By default, browsers don't allow drop
   * - preventDefault() enables dropping
   */
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  /**
   * handleDrop: User drops task on new column
   * 
   * REAL-TIME FLOW:
   * 1. Get new status (column name)
   * 2. Update local state (optimistic UI)
   * 3. Emit Socket.io event
   * 4. Backend updates database
   * 5. Backend broadcasts to all users
   * 6. All users' boards update
   */
  const handleDrop = async (newStatus) => {
    if (!draggedTask) return;

    try {
      // ================================================================
      // OPTIMISTIC UI UPDATE
      // ================================================================
      // Update local state immediately
      // This makes dragging feel smooth (no lag)
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task._id === draggedTask._id
            ? { ...task, status: newStatus }
            : task
        )
      );

      // ================================================================
      // WEBSOCKET EVENT
      // ================================================================
      // Emit Socket.io event (see socketManager.js for handler)
      // Backend listens to 'task:move' and:
      // 1. Updates database
      // 2. Validates task belongs to this board
      // 3. Broadcasts 'task:updated' to all users in this board room
      const socket = getSocket();
      socket.emit('task:move', {
        taskId: draggedTask._id,
        newStatus,
        newPosition: 0,
        boardId: board._id
      });

      // ================================================================
      // REST API BACKUP
      // ================================================================
      // Also call REST API as backup
      // Socket.io is real-time, REST is traditional update
      // In production, you'd choose one or the other
      // (Socket.io for real-time, REST for standard apps)
      // Commented out here to avoid duplicate database updates:
      // await api.updateTask(draggedTask._id, { status: newStatus });

      setDraggedTask(null);

    } catch (err) {
      console.error('Error moving task:', err);
      setError('Failed to move task');
      // Revert state on error
      loadTasks();
    }
  };

  /**
   * handleSelectTask: Open task detail modal
   * 
   * USAGE: User clicks on task card
   * Shows: assignee, due date, tags, comments
   */
  const handleSelectTask = (task) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  /**
   * handleTaskUpdate: Update task from modal
   * 
   * WHEN CALLED:
   * - User updates task title/assignee/dueDate/tags in modal
   */
  const handleTaskUpdate = (updatedTask) => {
    setTasks(prevTasks =>
      prevTasks.map(t =>
        t._id === updatedTask._id ? updatedTask : t
      )
    );

    setSelectedTask(updatedTask);
  };

  /**
   * handleTaskDelete: Remove task
   */
  const handleTaskDelete = (taskId) => {
    setTasks(prevTasks => prevTasks.filter(t => t._id !== taskId));
    setShowTaskModal(false);
  };

  if (loading) return <div className="loading">Loading board...</div>;

  // Group tasks by status for column display
  const columnNames = board.columns || ['To Do', 'In Progress', 'Done'];
  const tasksByColumn = columnNames.reduce((acc, status) => {
    acc[status] = tasks.filter(t => t.status === status);
    return acc;
  }, {});

  return (
    <div className="kanban-container">
      <div className="kanban-header">
        <div>
          <button className="btn-back" onClick={onBack}>← Back</button>
          <h1>{board.title}</h1>
        </div>
        <div className="board-info">
          <span>{tasks.length} tasks</span>
          <span>{board.members?.length || 0} members</span>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* QUICK CREATE TASK */}
      <form onSubmit={handleCreateTask} className="create-task-form">
        <input
          type="text"
          placeholder="Add new task..."
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
        />
        <button type="submit">Add Task</button>
      </form>

      {/* KANBAN BOARD */}
      <div className="kanban-board">
        {columnNames.map(columnName => (
          <Column
            key={columnName}
            columnName={columnName}
            tasks={tasksByColumn[columnName]}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(columnName)}
            onTaskClick={handleSelectTask}
          />
        ))}
      </div>

      {/* TASK DETAIL MODAL */}
      {showTaskModal && selectedTask && (
        <TaskModal
          task={selectedTask}
          board={board}
          onClose={() => setShowTaskModal(false)}
          onUpdate={handleTaskUpdate}
          onDelete={handleTaskDelete}
        />
      )}
    </div>
  );
};

export default KanbanBoard;
