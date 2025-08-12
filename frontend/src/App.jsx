import { Outlet } from 'react-router-dom';

/**
 * Main App Component
 * Serves as the root layout for the application
 */
function App() {
  return (
    <div className="app">
      <Outlet />
    </div>
  );
}

export default App;