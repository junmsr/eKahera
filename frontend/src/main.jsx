import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

// App (keep it non-lazy as it's the root)
import App from "./App.jsx";

// Lazy load all page components
const Home = lazy(() => import("./pages/Home.jsx"));
const Services = lazy(() => import("./pages/Services.jsx"));
const GetStarted = lazy(() => import("./pages/GetStarted.jsx"));
const Contact = lazy(() => import("./pages/Contact.jsx"));
const Login = lazy(() => import("./pages/Login.jsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const POS = lazy(() => import("./pages/POS.jsx"));
const CashierPOS = lazy(() => import("./pages/CashierPOS.jsx"));
const Inventory = lazy(() => import("./pages/Inventory.jsx"));
const MobileScanner = lazy(() => import("./pages/MobileScanner.jsx"));
const SelectRole = lazy(() => import("./pages/SelectRole"));
const Customer = lazy(() => import("./pages/Customer"));
const CustomerEnter = lazy(() => import("./pages/CustomerEnter.jsx"));
const EnterStore = lazy(() => import("./pages/EnterStore.jsx"));
const Cashiers = lazy(() => import("./pages/Cashiers"));
const Logs = lazy(() => import("./pages/Logs.jsx"));
const Profile = lazy(() => import("./pages/Profile.jsx"));
const SuperAdmin = lazy(() => import("./pages/SuperAdmin.jsx"));
const SuperAdminView = lazy(() => import("./pages/SuperAdminView.jsx"));
const InitialSetup = lazy(() => import("./pages/InitialSetup.jsx"));
const StoreQR = lazy(() => import("./pages/StoreQR.jsx"));
const Receipt = lazy(() => import("./pages/Receipt.jsx"));
const Documents = lazy(() => import("./pages/Documents.jsx"));
const DocumentResubmission = lazy(() => import("./pages/DocumentResubmission"));
const DocumentResubmitPage = lazy(() => import("./pages/DocumentResubmitPage.jsx"));
const PublicDocumentResubmit = lazy(() => import("./pages/PublicDocumentResubmit.jsx"));
const NotFound = lazy(() => import("./pages/NotFound.jsx"));
const CustomerWaitingPage = lazy(() => import("./pages/CustomerWaitingPage.jsx"));

// Loading component for Suspense fallback
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);
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
          ) 
        },
        { 
          path: "services", 
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <Services />
            </Suspense>
          ) 
        },
        { 
          path: "get-started", 
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <GetStarted />
            </Suspense>
          ) 
        },
        { 
          path: "contact", 
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <Contact />
            </Suspense>
          ) 
        },
        { 
          path: "login", 
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <Login />
            </Suspense>
          ) 
        },
        { 
          path: "dashboard", 
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <Dashboard />
            </Suspense>
          ) 
        },
        { 
          path: "dashboard/store-qr", 
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <StoreQR />
            </Suspense>
          ) 
        },
        { 
          path: "pos", 
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <POS />
            </Suspense>
          ) 
        },
        { 
          path: "cashier-pos", 
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <CashierPOS />
            </Suspense>
          ) 
        },
        { 
          path: "inventory", 
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <Inventory />
            </Suspense>
          ) 
        },
        { 
          path: "mobile-scanner", 
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <MobileScanner />
            </Suspense>
          ) 
        },
        { 
          path: "select-role", 
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <SelectRole />
            </Suspense>
          ) 
        },
        { 
          path: "customer", 
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <Customer />
            </Suspense>
          ) 
        },
        { 
          path: "customer-enter", 
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <CustomerEnter />
            </Suspense>
          ) 
        },
        { 
          path: "receipt", 
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <Receipt />
            </Suspense>
          ) 
        },
        { 
          path: "customer-waiting", 
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <CustomerWaitingPage />
            </Suspense>
          ) 
        },
        { 
          path: "enter-store", 
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <EnterStore />
            </Suspense>
          ) 
        },
        { 
          path: "cashiers", 
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <Cashiers />
            </Suspense>
          ) 
        },
        { 
          path: "logs", 
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <Logs />
            </Suspense>
          ) 
        },
        { 
          path: "profile", 
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <Profile />
            </Suspense>
          ) 
        },
        { 
          path: "documents", 
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <Documents />
            </Suspense>
          ) 
        },
        { 
          path: "superadmin", 
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <SuperAdmin />
            </Suspense>
          ) 
        },
        { 
          path: "superadmin/stores/:id", 
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <SuperAdminView />
            </Suspense>
          ) 
        },
        { 
          path: "setup", 
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <InitialSetup />
            </Suspense>
          ) 
        },
        { 
          path: "resubmit-application", 
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <DocumentResubmission />
            </Suspense>
          ) 
        },
        { 
          path: "resubmit-documents", 
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <PublicDocumentResubmit />
            </Suspense>
          ) 
        },
        { 
          path: "resubmit-document/:documentId", 
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <DocumentResubmitPage />
            </Suspense>
          ) 
        },
        // Catch-all route for 404
        { 
          path: "*", 
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <NotFound />
            </Suspense>
          ) 
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
