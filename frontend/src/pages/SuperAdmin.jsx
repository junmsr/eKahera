import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Background from "../components/layout/Background";
import DocumentVerification from "../components/ui/SuperAdmin/DocumentVerification";
import { api } from "../lib/api";
import Modal from "../components/modals/Modal";

// Icon for Logout Button
const LogoutIcon = () => (
  <svg
    className="w-5 h-5 text-red-600"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
    />
  </svg>
);

function SuperAdmin() {
  const [activeTab, setActiveTab] = useState("stores");

  // temporary single sample store
  const sampleStores = [
    {
      id: "sample-1",
      name: "ABC Store",
      email: "abc@store.com",
      status: "approved",
    },
  ];

  const [stores, setStores] = useState(sampleStores);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    store: null,
  });
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  // This state is used to trigger a refresh in the DocumentVerification component
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  // Get token from sessionStorage or localStorage (consistent with other parts of the app)
  const token =
    sessionStorage.getItem("auth_token") || localStorage.getItem("token");


  // Logout modal state
  const [logoutModal, setLogoutModal] = useState({ isOpen: false });

  const formatDate = (val) => {
    if (!val) return "N/A";
    try {
      return new Date(val).toLocaleDateString();
    } catch {
      return val;
    }
  };

  // --- Logout Modal Handlers ---

  const openLogoutModal = () => {
    setLogoutModal({ isOpen: true });
  };

  const closeLogoutModal = () => {
    setLogoutModal({ isOpen: false });
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchStores();
    // Simulate a network request delay for visual feedback
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

  const confirmLogout = () => {
    sessionStorage.removeItem("auth_token");
    sessionStorage.removeItem("user");
    localStorage.removeItem("auth_token"); // Remove local storage token just in case
    localStorage.removeItem("user"); // Remove local storage user object just in case
    navigate("/");
  };

  // Get user information (Updated to use sessionStorage primarily)
  const user = (() => {
    try {
      // Prioritize sessionStorage, fallback to localStorage if needed
      const sessionUser = sessionStorage.getItem("user");
      if (sessionUser) return JSON.parse(sessionUser);

      const localUser = localStorage.getItem("user");
      if (localUser) return JSON.parse(localUser);

      return {};
    } catch {
      return {};
    }
  })();

  useEffect(() => {
    if (location.state?.from === "storeManagement") {
      setActiveTab("stores");
    }
    fetchStores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  // --- Store Management Handlers ---

  const fetchStores = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api("/api/superadmin/stores", {
        headers: { Authorization: `Bearer ${token}` },
      });
      // if backend returns stores replace sample; otherwise keep sampleStores
      if (Array.isArray(res) && res.length > 0) {
        setStores(res);
      }
    } catch (err) {
      // keep sample store on error
      setError("Using sample data");
    } finally {
      setLoading(false);
    }
  };

  const handleView = (store) => {
    navigate(`/superadmin/stores/${store.id}`);
  };

  const handleDelete = (store) => {
    setDeleteModal({ isOpen: true, store });
    setDeletePassword("");
    setDeleteError("");
  };

  const confirmDelete = async () => {
    if (!deleteModal.store || !deletePassword) return;

    setDeleteLoading(true);
    setDeleteError("");
    try {
      await api(`/api/superadmin/stores/${deleteModal.store.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password: deletePassword }),
      });

      // Remove store from local state
      setStores((prev) => prev.filter((s) => s.id !== deleteModal.store.id));
      setDeleteModal({ isOpen: false, store: null });
      setError("");
    } catch (err) {
      setDeleteError("Failed to delete store. Please check your password and try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, store: null });
    setDeletePassword("");
    setDeleteError("");
  };


  return (
    <Background variant="gradientBlue" pattern="dots" floatingElements overlay>
      <div className="flex h-screen overflow-hidden">
        <div className="flex-1 flex flex-col h-screen">
          <header className="sticky top-0 z-50 flex items-center justify-between px-3 sm:px-4 md:px-6 py-3 sm:py-4 bg-white/95 backdrop-blur-md border-b border-gray-200/50 shadow-sm gap-2 sm:gap-3">
            {/* Left Section: Title */}
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0 flex-1">
              <div className="flex flex-col min-w-0">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent tracking-tight truncate">
                  Super Admin Dashboard
                </h1>
                <p className="text-xs text-gray-500 font-medium truncate">
                  Manage stores and verifications
                </p>
              </div>
            </div>

            {/* Right Section: User Info and Actions (Merged and Simplified) */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2.5 rounded-lg bg-white border border-gray-200 shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 group disabled:opacity-50"
                title="Refresh Data"
              >
                <svg
                  className={`w-5 h-5 text-gray-600 ${
                    isRefreshing ? "animate-spin" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>

              {/* Logout Button (Using sessionStorage) */}
              <button
                onClick={openLogoutModal}
                className="p-2.5 rounded-lg bg-white border border-red-200 shadow-sm hover:bg-red-50 hover:border-red-300 transition-all duration-200 group"
                title="Logout"
              >
                <LogoutIcon />
              </button>
            </div>
          </header>

          <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 overflow-auto bg-gradient-to-br from-gray-50 via-blue-50/30 to-green-50/20">
            {/* Tab Navigation - Modern Design */}
            <div className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl mb-4 sm:mb-5 md:mb-6 shadow-sm overflow-hidden">
              <div className="flex overflow-x-auto">
                <button
                  onClick={() => setActiveTab("stores")}
                  className={`relative px-4 sm:px-5 md:px-6 py-3 sm:py-3.5 md:py-4 font-semibold text-xs sm:text-sm transition-all duration-300 whitespace-nowrap flex-shrink-0 ${
                    activeTab === "stores"
                      ? "text-blue-700 bg-blue-50/50"
                      : "text-gray-600 hover:text-blue-600 hover:bg-gray-50/50"
                  }`}
                >
                  <span className="relative z-10 flex items-center gap-1.5 sm:gap-2">
                    <svg
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                    <span className="hidden sm:inline">Store Management</span>
                    <span className="sm:hidden">Stores</span>
                  </span>
                  {activeTab === "stores" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-blue-700" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("verification")}
                  className={`relative px-4 sm:px-5 md:px-6 py-3 sm:py-3.5 md:py-4 font-semibold text-xs sm:text-sm transition-all duration-300 whitespace-nowrap flex-shrink-0 ${
                    activeTab === "verification"
                      ? "text-blue-700 bg-blue-50/50"
                      : "text-gray-600 hover:text-blue-600 hover:bg-gray-50/50"
                  }`}
                >
                  <span className="relative z-10 flex items-center gap-1.5 sm:gap-2">
                    <svg
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <span className="hidden sm:inline">
                      Document Verification
                    </span>
                    <span className="sm:hidden">Verification</span>
                  </span>
                  {activeTab === "verification" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-600 to-blue-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === "verification" ? (
              <DocumentVerification
                isRefreshing={isRefreshing}
                key={activeTab}
              />
            ) : (
              <div className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl shadow-sm overflow-hidden">
                {/* Header Section */}
                <div className="bg-gradient-to-r from-blue-50/50 via-blue-50/30 to-green-50/20 border-b border-gray-200/50 px-4 sm:px-5 md:px-6 py-4 sm:py-4.5 md:py-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div className="min-w-0 flex-1">
                      <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent truncate">
                        Store Management
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1 truncate">
                        Manage and monitor all registered stores
                      </p>
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-4 sm:p-5 md:p-6">
                  {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                      <svg
                        className="w-5 h-5 text-red-600 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="text-red-700 text-sm font-medium">
                        {(() => {
                          try {
                            const parsed = JSON.parse(error);
                            return parsed.error || parsed.message || error;
                          } catch {
                            return error;
                          }
                        })()}
                      </span>
                    </div>
                  )}

                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                        <p className="text-sm text-gray-600 font-medium">
                          Loading stores...
                        </p>
                      </div>
                    </div>
                  ) : stores.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <svg
                          className="w-8 h-8 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No stores found
                      </h3>
                      <p className="text-sm text-gray-600">
                        Get started by approving new store registrations.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto -mx-4 sm:-mx-5 md:-mx-6 px-4 sm:px-5 md:px-6">
                      <table className="min-w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 sm:py-4 px-2 sm:px-3 md:px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[150px]">
                              Store Name
                            </th>
                            <th className="text-left py-3 sm:py-4 px-2 sm:px-3 md:px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[180px]">
                              Email
                            </th>
                            <th className="text-left py-3 sm:py-4 px-2 sm:px-3 md:px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[150px]">
                              Business Type
                            </th>
                            <th className="text-left py-3 sm:py-4 px-2 sm:px-3 md:px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[100px]">
                              Status
                            </th>
                            <th className="text-right py-3 sm:py-4 px-2 sm:px-3 md:px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[200px]">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {stores.map((s) => (
                            <tr
                              key={s.id}
                              className="hover:bg-blue-50/30 transition-colors duration-150 group"
                            >
                              <td className="py-3 sm:py-4 px-2 sm:px-3 md:px-4">
                                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                  <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-xs sm:text-sm shadow-sm flex-shrink-0">
                                    {s.name?.charAt(0)?.toUpperCase() || "S"}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm sm:text-base font-semibold text-gray-900 group-hover:text-blue-700 transition-colors truncate">
                                      {s.name}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 sm:py-4 px-2 sm:px-3 md:px-4">
                                <p className="text-xs sm:text-sm text-gray-600 truncate max-w-[200px] sm:max-w-none">
                                  {s.email}
                                </p>
                              </td>
                              <td className="py-3 sm:py-4 px-2 sm:px-3 md:px-4">
                                <p className="text-xs sm:text-sm text-gray-600 truncate max-w-[150px] sm:max-w-none">
                                  {s.business_type || 'N/A'}
                                </p>
                              </td>
                              <td className="py-3 sm:py-4 px-2 sm:px-3 md:px-4">
                              <div className="flex flex-col gap-1">
                                {s.status === "approved" ? (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>
                                    Active
                                  </span>
                                ) : s.status === "suspended" ? (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 border border-yellow-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-600"></span>
                                    Suspended
                                  </span>
                                ) : s.status === "rejected" ? (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                                    Rejected
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                                    Pending
                                  </span>
                                )}
                                {s.deletion_status === "pending" && (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-orange-100 text-orange-700 border border-orange-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                                    Deletion scheduled {formatDate(s.deletion_scheduled_for)}
                                  </span>
                                )}
                              </div>
                              </td>
                              <td className="py-3 sm:py-4 px-2 sm:px-3 md:px-4">
                                <div className="flex items-center justify-end gap-1 sm:gap-1.5 md:gap-2 flex-wrap">
                                  <button
                                    onClick={() => handleView(s)}
                                    className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                                    title="View Details"
                                  >
                                    View
                                  </button>

                                  <button
                                    onClick={() => handleDelete(s)}
                                    className="p-1.5 sm:p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 border border-transparent hover:border-red-200 flex-shrink-0"
                                    title="Delete Store"
                                  >
                                    <svg
                                      className="w-4 h-4 sm:w-5 sm:h-5"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        title=""
        size="md"
      >
        <div className="p-0">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-red-50 via-red-50/80 to-orange-50/50 border-b border-red-100 px-6 py-5 rounded-t-2xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  Confirm Store Deletion
                </h2>
                <p className="text-sm text-gray-600">
                  This action cannot be undone
                </p>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-6 space-y-6">
            {/* Warning Message */}
            <div className="bg-red-50/50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <svg
                    className="w-5 h-5 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    You are about to delete:{" "}
                    <span className="text-red-700 font-bold">
                      {deleteModal.store?.name}
                    </span>
                  </p>
                  <p className="text-sm text-red-700">
                    All associated data including users, products, inventory,
                    and sales records will be permanently deleted.
                  </p>
                </div>
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label
                htmlFor="deletePassword"
                className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3"
              >
                <div className="w-5 h-5 bg-white border-2 border-blue-500 rounded flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                Enter your password to confirm
              </label>
              <div className="relative">
                <input
                  type="password"
                  id="deletePassword"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="Enter your password"
                  disabled={deleteLoading}
                />
              </div>
              {deleteError && (
                <p className="text-red-600 text-sm mt-2">{deleteError}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={closeDeleteModal}
                disabled={deleteLoading}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={!deletePassword || deleteLoading}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {deleteLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Deleting...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Delete Store
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={logoutModal.isOpen}
        onClose={closeLogoutModal}
        title=""
        size="sm"
      >
        <div className="p-0">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-red-50 via-red-50/80 to-orange-50/50 border-b border-red-100 px-6 py-5 rounded-t-2xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  Confirm Logout
                </h2>
                <p className="text-sm text-gray-600">
                  Are you sure you want to log out?
                </p>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-6">
            <p className="text-sm text-gray-700 mb-6">
              You will be redirected to the login page and your session will
              end.
            </p>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <button
                onClick={closeLogoutModal}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </Background>
  );
}

export default SuperAdmin;
