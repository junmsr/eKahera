import React, { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css"; // Import global styles first

// App (keep it non-lazy as it's the root)
import App from "./App.jsx";

// Preload function for components with styles
const lazyWithPreload = (importFn) => {
  const Component = lazy(importFn);
  // Add preload method to the lazy component
  Component.preload = importFn;
  return Component;
};

// Lazy load all page components with preload support
const Home = lazyWithPreload(() => import("./pages/Home.jsx"));
const Services = lazyWithPreload(() => import("./pages/Services.jsx"));
const GetStarted = lazyWithPreload(() => import("./pages/GetStarted.jsx"));
const Contact = lazyWithPreload(() => import("./pages/Contact.jsx"));
const Login = lazyWithPreload(() => import("./pages/Login.jsx"));
const ForgotPassword = lazyWithPreload(() =>
  import("./pages/ForgotPassword.jsx")
);
const Dashboard = lazyWithPreload(() => import("./pages/Dashboard.jsx"));
const POS = lazyWithPreload(() => import("./pages/POS.jsx"));
const CashierPOS = lazyWithPreload(() => import("./pages/CashierPOS.jsx"));
const Inventory = lazyWithPreload(() => import("./pages/Inventory.jsx"));
const MobileScanner = lazyWithPreload(() =>
  import("./pages/MobileScanner.jsx")
);
const SelectRole = lazyWithPreload(() => import("./pages/SelectRole"));
const Customer = lazyWithPreload(() => import("./pages/Customer"));
const CustomerEnter = lazyWithPreload(() =>
  import("./pages/CustomerEnter.jsx")
);
const EnterStore = lazyWithPreload(() => import("./pages/EnterStore.jsx"));
const Cashiers = lazyWithPreload(() => import("./pages/Cashiers"));
const Logs = lazyWithPreload(() => import("./pages/Logs.jsx"));
const Profile = lazyWithPreload(() => import("./pages/Profile.jsx"));
const SuperAdmin = lazyWithPreload(() => import("./pages/SuperAdmin.jsx"));
const SuperAdminView = lazyWithPreload(() =>
  import("./pages/SuperAdminView.jsx")
);
const InitialSetup = lazyWithPreload(() => import("./pages/InitialSetup.jsx"));
const StoreQR = lazyWithPreload(() => import("./pages/StoreQR.jsx"));
const Receipt = lazyWithPreload(() => import("./pages/Receipt.jsx"));
const Documents = lazyWithPreload(() => import("./pages/Documents.jsx"));
const DocumentResubmission = lazyWithPreload(() =>
  import("./pages/DocumentResubmission")
);
const DocumentResubmitPage = lazyWithPreload(() =>
  import("./pages/DocumentResubmitPage.jsx")
);
const PublicDocumentResubmit = lazyWithPreload(() =>
  import("./pages/PublicDocumentResubmit.jsx")
);
const NotFound = lazyWithPreload(() => import("./pages/NotFound.jsx"));
const CustomerWaitingPage = lazyWithPreload(() =>
  import("./pages/CustomerWaitingPage.jsx")
);
const DemoDashboard = lazyWithPreload(() =>
  import("./pages/DemoDashboard.jsx")
);
const DemoPOS = lazyWithPreload(() => import("./pages/DemoPOS.jsx"));
const DemoCashiers = lazyWithPreload(() => import("./pages/DemoCashiers.jsx"));
const DemoInventory = lazyWithPreload(() =>
  import("./pages/DemoInventory.jsx")
);
const DemoLogs = lazyWithPreload(() => import("./pages/DemoLogs.jsx"));
const DemoProfile = lazyWithPreload(() => import("./pages/DemoProfile.jsx"));
const Documentation = lazyWithPreload(() => import("./pages/Documentation.jsx"));

// Enhanced Loading component for Suspense fallback
const LoadingFallback = () => {
  // Preload all components in the background
  React.useEffect(() => {
    const preloadComponents = async () => {
      try {
        await Promise.all([
          Home.preload(),
          Services.preload(),
          // Add other critical components you want to preload
        ]);
      } catch (error) {
        console.error("Failed to preload components:", error);
      }
    };
    preloadComponents();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
};
// Router Configuration with Suspense
const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <App />,
      children: [
        {
          index: true,
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <Home />
            </Suspense>
          ),
        },
        {
          path: "services",
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <Services />
            </Suspense>
          ),
        },
        {
          path: "get-started",
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <GetStarted />
            </Suspense>
          ),
        },
        {
          path: "contact",
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <Contact />
            </Suspense>
          ),
        },
        {
          path: "documentation",
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <Documentation />
            </Suspense>
          ),
        },
        {
          path: "login",
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <Login />
            </Suspense>
          ),
        },
        {
          path: "forgot-password",
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <ForgotPassword />
            </Suspense>
          ),
        },
        {
          path: "dashboard",
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <Dashboard />
            </Suspense>
          ),
        },
        {
          path: "dashboard/store-qr",
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <StoreQR />
            </Suspense>
          ),
        },
        {
          path: "pos",
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <POS />
            </Suspense>
          ),
        },
        {
          path: "cashier-pos",
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <CashierPOS />
            </Suspense>
          ),
        },
        {
          path: "inventory",
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <Inventory />
            </Suspense>
          ),
        },
        {
          path: "mobile-scanner",
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <MobileScanner />
            </Suspense>
          ),
        },
        {
          path: "select-role",
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <SelectRole />
            </Suspense>
          ),
        },
        {
          path: "customer",
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <Customer />
            </Suspense>
          ),
        },
        {
          path: "customer-enter",
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <CustomerEnter />
            </Suspense>
          ),
        },
        {
          path: "receipt",
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <Receipt />
            </Suspense>
          ),
        },
        {
          path: "customer-waiting",
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <CustomerWaitingPage />
            </Suspense>
          ),
        },
        {
          path: "enter-store",
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <EnterStore />
            </Suspense>
          ),
        },
        {
          path: "cashiers",
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <Cashiers />
            </Suspense>
          ),
        },
        {
          path: "logs",
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <Logs />
            </Suspense>
          ),
        },
        {
          path: "profile",
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <Profile />
            </Suspense>
          ),
        },
        {
          path: "documents",
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <Documents />
            </Suspense>
          ),
        },
        {
          path: "superadmin",
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <SuperAdmin />
            </Suspense>
          ),
        },
        {
          path: "superadmin/stores/:id",
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <SuperAdminView />
            </Suspense>
          ),
        },
        {
          path: "setup",
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <InitialSetup />
            </Suspense>
          ),
        },
        {
          path: "resubmit-application",
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <DocumentResubmission />
            </Suspense>
          ),
        },
        {
          path: "resubmit-documents",
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <PublicDocumentResubmit />
            </Suspense>
          ),
        },
        {
          path: "resubmit-document/:documentId",
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <DocumentResubmitPage />
            </Suspense>
          ),
        },
        {
          path: "demo/dashboard",
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <DemoDashboard />
            </Suspense>
          ),
        },
        {
          path: "demo/pos",
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <DemoPOS />
            </Suspense>
          ),
        },
        {
          path: "demo/cashiers",
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <DemoCashiers />
            </Suspense>
          ),
        },
        {
          path: "demo/inventory",
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <DemoInventory />
            </Suspense>
          ),
        },
        {
          path: "demo/logs",
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <DemoLogs />
            </Suspense>
          ),
        },
        {
          path: "demo/profile",
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <DemoProfile />
            </Suspense>
          ),
        },
        // Catch-all route for 404
        {
          path: "*",
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <NotFound />
            </Suspense>
          ),
        },
      ],
    },
  ],
  {
    basename: "/",
  }
);

// Render Application
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
