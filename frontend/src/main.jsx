import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

// App and Pages
import App from "./App.jsx";
import Home from "./pages/Home.jsx";
import Services from "./pages/Services.jsx";
import GetStarted from "./pages/GetStarted.jsx";
import Contact from "./pages/Contact.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import POS from "./pages/POS.jsx";
import CashierPOS from "./pages/CashierPOS.jsx";
import Inventory from "./pages/Inventory.jsx";
import MobileScanner from "./pages/MobileScanner.jsx";
import SelectRole from "./pages/SelectRole";
import Customer from "./pages/Customer";
import Cashiers from "./pages/Cashiers";
import Logs from "./pages/Logs.jsx";
import Profile from "./pages/Profile.jsx";
import SuperAdmin from "./pages/SuperAdmin.jsx";
import SuperAdminView from "./pages/SuperAdminView.jsx";
import InitialSetup from "./pages/InitialSetup.jsx";

// Router Configuration
const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: "services", element: <Services /> },
      { path: "get-started", element: <GetStarted /> },
      { path: "contact", element: <Contact /> },
      { path: "login", element: <Login /> },
      { path: "dashboard", element: <Dashboard /> },
      { path: "pos", element: <POS /> },
      { path: "cashier-pos", element: <CashierPOS /> },
      { path: "inventory", element: <Inventory /> },
      { path: "mobile-scanner", element: <MobileScanner /> },
      { path: "select-role", element: <SelectRole /> },
      { path: "customer", element: <Customer /> },
      { path: "cashiers", element: <Cashiers /> },
      { path: "logs", element: <Logs /> },
      { path: "profile", element: <Profile /> },
      { path: "superadmin", element: <SuperAdmin /> },
      { path: "superadmin/stores/:id", element: <SuperAdminView /> },
      { path: "setup", element: <InitialSetup /> },
    ],
  },
]);

// Render Application
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);