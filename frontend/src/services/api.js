/**
 * =====================================================
 * API Service Module
 * =====================================================
 * 
 * WHY: Centralizes all API calls to backend.
 * Instead of using fetch() scattered throughout components,
 * we define all endpoints here for:
 * - Easy maintenance (update endpoints in one place)
 * - Consistent error handling
 * - Automatic JWT token inclusion in requests
 * - Easy debugging (see all API calls)
 * 
 * AXIOS: HTTP client library
 * - Better than fetch (less boilerplate)
 * - Automatic JSON serialization
 * - Request/response interceptors
 * - Error handling
 */

import axios from 'axios';

// Get API base URL from environment variable
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * CREATE AXIOS INSTANCE
 * 
 * Benefits:
 * - Reuse configuration
 * - Add global interceptors (auto-add token to all requests)
 * - Centralized error handling
 */
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * REQUEST INTERCEPTOR: Add JWT token to every request
 * 
 * WHY NEEDED:
 * - Protected endpoints require Authorization header
 * - Instead of manually adding token in each component,
 * - Interceptor does it automatically
 * 
 * FLOW:
 * 1. Component calls api.get('/boards')
 * 2. Interceptor runs before request
 * 3. Reads token from localStorage
 * 4. Adds header: Authorization: Bearer {token}
 * 5. Request sent with header included
 */
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');

    // If token exists, add it to Authorization header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * RESPONSE INTERCEPTOR: Handle errors globally
 * 
 * WHY NEEDED:
 * - If JWT expires (401 error), redirect to login
 * - Log errors for debugging
 * - Prevent showing same error in multiple components
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If 401 (unauthorized), user's token probably expired
    if (error.response?.status === 401) {
      // Clear stored token
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirect to login page
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

// =====================================================
// AUTHENTICATION API CALLS
// =====================================================

/**
 * signupUser: Register new account
 * 
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} name - User name
 * @returns {Promise} { success, token, user }
 */
const signupUser = async (email, password, name) => {
  const response = await api.post('/auth/signup', {
    email,
    password,
    name
  });
  return response.data;
};

/**
 * loginUser: Authenticate and get JWT
 * 
 * @param {string} email
 * @param {string} password
 * @returns {Promise} { success, token, user }
 */
const loginUser = async (email, password) => {
  const response = await api.post('/auth/login', {
    email,
    password
  });
  return response.data;
};

/**
 * getCurrentUser: Get logged-in user's data
 * 
 * USAGE: On app startup to restore user session
 * @returns {Promise} { success, user }
 */
const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

// =====================================================
// BOARD API CALLS
// =====================================================

/**
 * createBoard: Create new project board
 * 
 * @param {string} title
 * @param {string} description
 * @returns {Promise} { success, board }
 */
const createBoard = async (title, description) => {
  const response = await api.post('/boards', {
    title,
    description
  });
  return response.data;
};

/**
 * getAllBoards: Get all boards for current user
 * 
 * @returns {Promise} { success, boards }
 */
const getAllBoards = async () => {
  const response = await api.get('/boards');
  return response.data;
};

/**
 * getBoardDetail: Get single board with all tasks
 * 
 * USAGE: When user opens a board
 * @param {string} boardId
 * @returns {Promise} { success, board }
 */
const getBoardDetail = async (boardId) => {
  const response = await api.get(`/boards/${boardId}`);
  return response.data;
};

/**
 * updateBoard: Modify board details
 * 
 * @param {string} boardId
 * @param {object} updates { title, description, columns }
 * @returns {Promise} { success, board }
 */
const updateBoard = async (boardId, updates) => {
  const response = await api.put(`/boards/${boardId}`, updates);
  return response.data;
};

/**
 * deleteBoard: Remove a board
 * 
 * @param {string} boardId
 * @returns {Promise} { success, message }
 */
const deleteBoard = async (boardId) => {
  const response = await api.delete(`/boards/${boardId}`);
  return response.data;
};

/**
 * addBoardMember: Invite user to board
 * 
 * @param {string} boardId
 * @param {string} userId
 * @returns {Promise} { success, board }
 */
const addBoardMember = async (boardId, userId) => {
  const response = await api.post(`/boards/${boardId}/members`, { userId });
  return response.data;
};

// =====================================================
// TASK API CALLS
// =====================================================

/**
 * createTask: Add new task to board
 * 
 * @param {string} boardId
 * @param {string} title
 * @param {string} description
 * @param {string} status - Column name
 * @returns {Promise} { success, task }
 */
const createTask = async (boardId, title, description, status) => {
  const response = await api.post(`/boards/${boardId}/tasks`, {
    title,
    description,
    status
  });
  return response.data;
};

/**
 * getTasksByBoard: Get all tasks for a board
 * 
 * USAGE: When loading Kanban board
 * @param {string} boardId
 * @returns {Promise} { success, tasks, tasksByStatus }
 */
const getTasksByBoard = async (boardId) => {
  const response = await api.get(`/boards/${boardId}/tasks`);
  return response.data;
};

/**
 * getTaskDetail: Get single task (used in modal)
 * 
 * @param {string} taskId
 * @returns {Promise} { success, task }
 */
const getTaskDetail = async (taskId) => {
  const response = await api.get(`/${taskId}`);
  return response.data;
};

/**
 * updateTask: Modify task (move, assign, edit)
 * 
 * Can be called via REST or Socket.io
 * @param {string} taskId
 * @param {object} updates { title, status, assignee, dueDate, tags, etc }
 * @returns {Promise} { success, task }
 */
const updateTask = async (taskId, updates) => {
  const response = await api.put(`/${taskId}`, updates);
  return response.data;
};

/**
 * deleteTask: Remove a task
 * 
 * @param {string} taskId
 * @returns {Promise} { success, message }
 */
const deleteTask = async (taskId) => {
  const response = await api.delete(`/${taskId}`);
  return response.data;
};

// =====================================================
// COMMENT API CALLS
// =====================================================

/**
 * addComment: Post comment on task
 * 
 * Can be called via REST or Socket.io
 * @param {string} taskId
 * @param {string} text
 * @returns {Promise} { success, comment }
 */
const addComment = async (taskId, text) => {
  const response = await api.post(`/comments/${taskId}/comments`, { text });
  return response.data;
};

/**
 * getComments: Get all comments for a task
 * 
 * @param {string} taskId
 * @returns {Promise} { success, comments }
 */
const getComments = async (taskId) => {
  const response = await api.get(`/comments/${taskId}/comments`);
  return response.data;
};

/**
 * deleteComment: Remove a comment
 * 
 * @param {string} commentId
 * @returns {Promise} { success, message }
 */
const deleteComment = async (commentId) => {
  const response = await api.delete(`/comments/comments/${commentId}`);
  return response.data;
};

// Export all API functions as object
export default {
  // Auth
  signupUser,
  loginUser,
  getCurrentUser,
  // Boards
  createBoard,
  getAllBoards,
  getBoardDetail,
  updateBoard,
  deleteBoard,
  addBoardMember,
  // Tasks
  createTask,
  getTasksByBoard,
  getTaskDetail,
  updateTask,
  deleteTask,
  // Comments
  addComment,
  getComments,
  deleteComment
};
