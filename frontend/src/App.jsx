import { Outlet, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import SetupGuard from './components/common/SetupGuard';
import VerificationGuard from './components/common/VerificationGuard';

/**
 * Main App Component
 * Serves as the root layout for the application
 */
function App() {
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for storage changes to handle login redirects across tabs
    const handleStorageChange = (e) => {
      if (e.key === 'user' && e.newValue) {
        try {
          const user = JSON.parse(e.newValue);
          const role = (user?.role || '').toLowerCase();

          // Redirect based on role when user logs in from another tab
          if (role === 'cashier') {
            navigate('/cashier-pos');
          } else if (role === 'superadmin') {
            navigate('/superadmin');
          } else if (role === 'admin') {
            navigate('/dashboard');
          } else {
            navigate('/');
          }
        } catch (error) {
          console.error('Error parsing user data from localStorage:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [navigate]);

  return (
    <div className="app">
      <SetupGuard>
        <VerificationGuard>
          <Outlet />
        </VerificationGuard>
      </SetupGuard>
    </div>
  );
}

export default App;
