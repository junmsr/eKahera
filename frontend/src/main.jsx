import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// App and Pages
import App from './App.jsx';
import Home from './pages/Home.jsx';
import Services from './pages/Services.jsx';
import GetStarted from './pages/GetStarted.jsx';
import Contact from './pages/Contact.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import POS from './pages/POS.jsx';
import Inventory from './pages/Inventory.jsx';
import SelectRole from './pages/SelectRole';
import Customer from './pages/Customer';
import Cashiers from './pages/Cashiers';

// Router Configuration
const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'services', element: <Services /> },
      { path: 'get-started', element: <GetStarted /> },
      { path: 'contact', element: <Contact /> },
      { path: 'login', element: <Login /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'pos', element: <POS /> },
      { path: 'inventory', element: <Inventory /> },
      { path: 'select-role', element: <SelectRole /> },
      { path: 'customer', element: <Customer /> },
      { path: 'cashiers', element: <Cashiers /> },
    ],
  }
]);

// Render Application
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
