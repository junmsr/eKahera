import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import SetupGuard from "./components/common/SetupGuard";
import VerificationGuard from "./components/common/VerificationGuard";
/**
 * Main App Component
 * Serves as the root layout for the application
 */
function App() {
  const location = useLocation();

  return (
    <div className="app">
      <SetupGuard>
        <VerificationGuard>
          <AnimatePresence mode="wait" initial={false}>
            <Outlet key={location.pathname} />
          </AnimatePresence>
        </VerificationGuard>
      </SetupGuard>
    </div>
  );
}

export default App;
