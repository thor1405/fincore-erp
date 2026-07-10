import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading FinCore...</div>;
  }

  if (!user) {
    if (location.pathname === '/' || location.pathname === '') {
      return <Navigate to="/home" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
