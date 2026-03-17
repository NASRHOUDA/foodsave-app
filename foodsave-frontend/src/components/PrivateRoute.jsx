import React from 'react';
import { Navigate } from 'react-router-dom';
import userService from '../services/userService';

const PrivateRoute = ({ children }) => {
  const user = userService.getCurrentUser();
  return user ? children : <Navigate to="/login" />;
};

export default PrivateRoute;
