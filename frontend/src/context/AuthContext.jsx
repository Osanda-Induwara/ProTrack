/**
 * =====================================================
 * Authentication Context (State Management)
 * =====================================================
 * 
 * WHY: Centralized state management for authentication.
 * Instead of passing auth data through many components,
 * we use React Context to make it available everywhere.
 * 
 * FEATURES:
 * - Stores logged-in user data
 * - Stores JWT token
 * - Provides login/logout functions
 * - Persists user session to localStorage
 * 
 * USAGE: Wrap App with provider, then use useAuth hook
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

// Create the context
const AuthContext = createContext();

/**
 * AuthProvider: Wraps entire app, provides auth state
 * 
 * COMPONENT TREE:
 * <AuthProvider>  <- Provides auth state
 *   <App>
 *     <Dashboard />
 *     <Board />
 *     All components can use useAuth()
 *   </App>
 * </AuthProvider>
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // ================================================================
  // INITIALIZE AUTH STATE (when app loads)
  // ================================================================
  // Check if user was previously logged in
  // If yes, restore session from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }

    setLoading(false);
  }, []);

  // ================================================================
  // LOGIN FUNCTION
  // ================================================================
  // Called from Login component
  // Stores token and user data
  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);

    // Persist to localStorage so session survives refresh
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  // ================================================================
  // LOGOUT FUNCTION
  // ================================================================
  // Called from Logout button
  // Clears auth state and localStorage
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // ================================================================
  // PROVIDE STATE TO ALL COMPONENTS
  // ================================================================
  // value object has auth state + functions
  // Any component can access via useAuth()
  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!token  // Boolean: is user logged in?
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * useAuth Hook: Access authentication state
 * 
 * USAGE IN ANY COMPONENT:
 * const { user, token, login, logout, isAuthenticated } = useAuth();
 * 
 * This is much better than drilling props through many levels
 */
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
};

export default AuthContext;
