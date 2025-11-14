import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * AuthGuard Component
 * Checks if user is authenticated and redirects to login if not
 * Prevents redirect loops by checking current path
 */
export default function AuthGuard({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const token = sessionStorage.getItem('auth_token') || localStorage.getItem('token');

      // If no token and not on login page, redirect to login
      if (!token && location.pathname !== '/login') {
        // Preserve the intended destination
        const redirectPath = location.pathname !== '/' ? location.pathname + location.search : '/dashboard';
        navigate(`/login?redirect=${encodeURIComponent(redirectPath)}`, { replace: true });
      } else {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [navigate, location.pathname, location.search]);

  // Show loading while checking auth
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return children;
}
