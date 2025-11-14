import { Outlet } from 'react-router-dom';
import SetupGuard from './components/common/SetupGuard';
import VerificationGuard from './components/common/VerificationGuard';
import AuthGuard from './components/common/AuthGuard';

/**
 * Main App Component
 * Serves as the root layout for the application
 */
function App() {
  return (
    <div className="app">
      <SetupGuard>
        <AuthGuard>
          <VerificationGuard>
            <Outlet />
          </VerificationGuard>
        </AuthGuard>
      </SetupGuard>
    </div>
  );
}

export default App;
