import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated, isPinAuthenticated } from '../lib/storage';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    if (isAuthenticated()) {
        return <>{children}</>;
    }

    // Not face authenticated
    if (isPinAuthenticated()) {
        return <Navigate to="/camera" replace />;
    }

    // Not pin authenticated
    return <Navigate to="/" replace />;
};

export default ProtectedRoute;
