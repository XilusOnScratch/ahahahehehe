import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated, isPinAuthenticated, isStageCompleted } from '../lib/storage';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireStageCompleted?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireStageCompleted }) => {
    if (isAuthenticated()) {
        if (requireStageCompleted && !isStageCompleted(requireStageCompleted)) {
            return <Navigate to="/dash" replace />;
        }
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
