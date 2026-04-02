/**
 * =====================================================
 * Frontend Entry Point
 * =====================================================
 * 
 * WHY: Initialize React app and render to DOM
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import './index.css';

/**
 * COMPONENT HIERARCHY:
 * root.render(
 *   <AuthProvider>        <- Provides auth state to all components
 *     <App />             <- Main app with router
 *   </AuthProvider>
 * )
 */
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
