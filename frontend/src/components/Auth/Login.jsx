/**
 * =====================================================
 * Login Component
 * =====================================================
 * 
 * WHY: Authentication entry point.
 * Users see this if not logged in.
 * 
 * FEATURES:
 * - Email/password form
 * - Validation
 * - Error messages
 * - Links to signup
 * - JWT token storage
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import '../../styles/Auth.css';

const Login = ({ onSuccess, onSignUpClick }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  /**
   * handleSubmit: Process login form
   * 
   * FLOW:
   * 1. Validate inputs
   * 2. Call API /auth/login
   * 3. Receive token and user data
   * 4. Store in AuthContext (and localStorage)
   * 5. Redirect to dashboard
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // ================================================================
    // INPUT VALIDATION
    // ================================================================
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (email.indexOf('@') === -1) {
      setError('Please enter a valid email');
      return;
    }

    setLoading(true);

    try {
      // ================================================================
      // CALL BACKEND API
      // ================================================================
      // api.loginUser() calls: POST /api/auth/login
      // Backend verifies password, returns JWT token
      const response = await api.loginUser(email, password);

      if (response.success) {
        // ================================================================
        // STORE AUTHENTICATION DATA
        // ================================================================
        // login() stores token + user in AuthContext and localStorage
        // This makes user authenticated across entire app
        login(response.user, response.token);

        // Clear form
        setEmail('');
        setPassword('');

        // Redirect to dashboard
        if (onSuccess) onSuccess();
      }

    } catch (err) {
      // Show error from backend (e.g., "Invalid email or password")
      const errorMessage = err.response?.data?.message || 'Login failed';
      setError(errorMessage);
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h1>Login</h1>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              disabled={loading}
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="auth-link">
          Don't have an account? <button type="button" onClick={onSignUpClick} style={{background: 'none', border: 'none', color: '#667eea', cursor: 'pointer', textDecoration: 'underline'}}>Sign up</button>
        </p>
      </div>
    </div>
  );
};

export default Login;
