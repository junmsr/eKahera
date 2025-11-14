import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../../lib/api';
import Loader from './Loader';
import Background from '../layout/Background';

/**
 * SetupGuard Component
 * Checks if initial setup is needed and redirects to setup page if required
 */
export default function SetupGuard({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    // Only check setup status once per session to prevent loops
    const hasChecked = sessionStorage.getItem('setup_checked');
    if (!hasChecked) {
      checkSetupStatus();
      sessionStorage.setItem('setup_checked', 'true');
    } else {
      setLoading(false);
    }
  }, []);

  const checkSetupStatus = async () => {
    try {
      // Skip setup check if already on setup page
      if (location.pathname === '/setup') {
        setLoading(false);
        return;
      }

      const response = await api('/api/auth/setup/status');

      if (response.needsSetup) {
        setNeedsSetup(true);
        // Only redirect if not already on setup page
        if (location.pathname !== '/setup') {
          navigate('/setup', { replace: true });
        }
      } else {
        setNeedsSetup(false);
      }
    } catch (error) {
      console.error('Setup status check failed:', error);
      // On error, assume setup is not needed to avoid blocking the app
      setNeedsSetup(false);
    } finally {
      setLoading(false);
    }
  };

  // Show loading screen while checking setup status
  if (loading) {
    return (
      <Background variant="gradientBlue" pattern="dots" overlay>
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <Loader size="lg" className="mb-4" />
            <p className="text-white text-lg">Checking system status...</p>
          </div>
        </div>
      </Background>
    );
  }

  // If setup is needed and we're not on the setup page, don't render children
  if (needsSetup && location.pathname !== '/setup') {
    return null;
  }

  // Render children if setup is complete or we're on the setup page
  return children;
}
