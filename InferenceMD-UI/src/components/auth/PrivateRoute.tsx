import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface PrivateRouteProps {
  redirectPath?: string;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ redirectPath = '/login' }) => {
  const { isAuthenticated, loading } = useAuth();

  // If still loading auth state, display loading
  if (loading) {
    return <div>Loading...</div>;
  }
  
  // If not authenticated, redirect to login
  return isAuthenticated ? <Outlet /> : <Navigate to={redirectPath} replace />
};

export default PrivateRoute;