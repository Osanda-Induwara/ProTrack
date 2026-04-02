/**
 * =====================================================
 * SignUp Component
 * =====================================================
 * 
 * WHY: Account creation page.
 * New users register here to create account.
 * 
 * FEATURES:
 * - Name, email, password input
 * - Password validation
 * - Duplicate email checking
 * - Links to login page
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import '../../styles/Auth.css';

const SignUp = ({ onSuccess, onLoginClick }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  /**
   * handleSubmit: Process signup form
   * 
   * FLOW:
   * 1. Validate all inputs
   * 2. Check passwords match
   * 3. Call API /auth/signup
   * 4. Receive token (auto-login)
   * 5. Store in AuthContext
   * 6. Redirect to dashboard
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // ================================================================
    // INPUT VALIDATION
    // ================================================================
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      // ================================================================
      // CALL BACKEND API
      // ================================================================
      // api.signupUser() calls: POST /api/auth/signup
      // Backend creates user, hashes password, returns JWT token
      const response = await api.signupUser(email, password, name);

      if (response.success) {
        // ================================================================
        // AUTO-LOGIN AFTER SIGNUP
        // ================================================================
        // Backend returns token, so new user is immediately logged in
        login(response.user, response.token);

        // Clear form
        setName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');

        // Redirect to dashboard
        if (onSuccess) onSuccess();
      }

    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Signup failed';
      setError(errorMessage);
      console.error('Signup error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h1>Create Account</h1>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              disabled={loading}
            />
          </div>

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

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••"
              disabled={loading}
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="auth-link">
          Already have an account? <button type="button" onClick={onLoginClick} style={{background: 'none', border: 'none', color: '#667eea', cursor: 'pointer', textDecoration: 'underline'}}>Login</button>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
