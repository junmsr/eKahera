import { Outlet } from 'react-router-dom';
import SetupGuard from './components/common/SetupGuard';
import VerificationGuard from './components/common/VerificationGuard';
/**
 * Main App Component
 * Serves as the root layout for the application
 */
function App() {
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
