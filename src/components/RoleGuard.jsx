import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export const RoleGuard = ({ allowedRoles, children }) => {
  const { user } = useAuth();
  
  if (!user || !user.role) {
    return null;
  }
  
  if (!allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
};
