import { Outlet } from 'react-router-dom';
import VerificationGuard from './components/common/VerificationGuard';
import AuthGuard from './components/common/AuthGuard';

/**
 * Main App Component
 * Serves as the root layout for the application
 */
function App() {
  return (
    <div className="app">
      <AuthGuard>
        <VerificationGuard>
          <Outlet />
        </VerificationGuard>
      </AuthGuard>
    </div>
  );
}

export default App;
