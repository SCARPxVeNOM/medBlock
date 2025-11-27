/**
 * React Consent UI - Main Application
 * Healthcare data collaboration platform frontend
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import RecordDetail from './pages/RecordDetail';
import AuditView from './pages/AuditView';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} 
      />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/record/:recordId" 
        element={
          <ProtectedRoute>
            <RecordDetail />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/audit" 
        element={
          <ProtectedRoute>
            <AuditView />
          </ProtectedRoute>
        } 
      />
      <Route path="/" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-black-900 via-black-800 to-black-900">
          <nav className="bg-black/5 backdrop-blur-md border-b border-black/10 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                
                <div className="flex items-center space-x-4">
                  <NavLinks />
                </div>
              </div>
            </div>
          </nav>
          <main>
            <AppRoutes />
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

function NavLinks() {
  const { isAuthenticated, user, logout } = useAuth();

  if (!isAuthenticated) return null;

  return (
    <>
      <a href="/dashboard" className="text-white/80 hover:text-white px-3 py-2 text-sm font-medium transition-colors">
        Dashboard
      </a>
      <a href="/audit" className="text-white/80 hover:text-white px-3 py-2 text-sm font-medium transition-colors">
        Audit Log
      </a>
      <span className="text-white/60 text-sm px-3 py-2">
        {user?.name || user?.id}
      </span>
      <button
        onClick={logout}
        className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-200 px-4 py-2 rounded-lg text-sm transition-all"
      >
        Logout
      </button>
    </>
  );
}

export default App;

