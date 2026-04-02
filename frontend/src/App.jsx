/**
 * =====================================================
 * Main App Component (Router & Layout)
 * =====================================================
 * 
 * WHY: Central component that manages:
 * - Authentication status
 * - Routing between pages (login, signup, dashboard)
 * - Session restoration on page load
 * - Global error handling
 * 
 * FLOW:
 * 1. Component mounts -> Check if user is logged in (AuthContext)
 * 2. If not logged in -> Show Login page
 * 3. If logged in -> Show Dashboard (BoardList + KanbanBoard)
 * 4. User clicks board -> Show KanbanBoard
 * 5. User logs out -> Clear auth, show Login page
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { initSocket, disconnectSocket } from './services/socket';
import Login from './components/Auth/Login';
import SignUp from './components/Auth/SignUp';
import BoardList from './components/Board/BoardList';
import KanbanBoard from './components/Kanban/KanbanBoard';
import './App.css';

const App = () => {
  // ================================================================
  // STATE MANAGEMENT
  // ================================================================
  const { user, token, loading, logout, login } = useAuth();
  const [showSignUp, setShowSignUp] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState(null);

  /**
   * AUTHENTICATE ON APP STARTUP
   * 
   * FLOW:
   * 1. Check localStorage for saved token
   * 2. If exists, restore user session
   * 3. User stays logged in across refreshes
   */
  useEffect(() => {
    if (token) {
      // Initialize WebSocket connection when user is authenticated
      initSocket();
    }
  }, [token]);

  // ================================================================
  // HANDLE LOGOUT
  // ================================================================
  const handleLogout = () => {
    // Clear auth state
    logout();

    // Close WebSocket connection
    disconnectSocket();

    // Reset UI
    setSelectedBoard(null);
    setShowSignUp(false);
  };

  // ================================================================
  // SHOW LOADING WHILE CHECKING AUTH
  // ================================================================
  if (loading) {
    return (
      <div className="app-loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // ================================================================
  // NO TOKEN: SHOW AUTH PAGES
  // ================================================================
  if (!token) {
    return (
      <div className="app">
        {showSignUp ? (
          <SignUp
            onSuccess={() => setShowSignUp(false)}
            onLoginClick={() => setShowSignUp(false)}
          />
        ) : (
          <Login
            onSuccess={() => setShowSignUp(false)}
            onSignUpClick={() => setShowSignUp(true)}
          />
        )}
      </div>
    );
  }

  // ================================================================
  // AUTHENTICATED: SHOW DASHBOARD
  // ================================================================
  return (
    <div className="app">
      {/* HEADER */}
      <header className="app-header">
        <div className="header-title">
          <h1>📊 Project Manager</h1>
        </div>
        <div className="header-user">
          <span>Welcome, <strong>{user.name}</strong></span>
          <button
            className="btn-logout"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="app-main">
        {selectedBoard ? (
          // KANBAN BOARD VIEW
          <KanbanBoard
            board={selectedBoard}
            onBack={() => setSelectedBoard(null)}
          />
        ) : (
          // BOARD LIST VIEW
          <BoardList
            onSelectBoard={(board) => setSelectedBoard(board)}
            onCreateBoard={() => {}}
          />
        )}
      </main>

      {/* FOOTER */}
      <footer className="app-footer">
        <p>Real-time Project Management • MERN Stack • Socket.io</p>
      </footer>
    </div>
  );
};

export default App;
