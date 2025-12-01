import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Background from "../components/layout/Background";
import { api } from "../lib/api";

export default function SuperAdminView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      setError("");
      try {
        const token = sessionStorage.getItem("auth_token"); 
        const res = await api(`/api/superadmin/stores/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        console.log(res);
        setStore(res);
      } catch (err) {
        setError(err?.message || "Failed to fetch store details");
        setStore(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const downloadDocument = async (documentId, fileName) => {
    if (!documentId) return;
    setDownloadingId(documentId);
    try {
      const token = sessionStorage.getItem("auth_token"); 
      const response = await api(
        `/documents/download/${documentId}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        },
        true
      );
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = fileName || "document";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading document:", error);
      alert("Error downloading document");
    } finally {
      setDownloadingId(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  const renderStatusPill = (status) => {
    const normalized = (status || "pending").toLowerCase();
    const palettes = {
      approved: "bg-green-100 text-green-700 border-green-200",
      rejected: "bg-red-100 text-red-700 border-red-200",
      pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
    };
    const classes = palettes[normalized] || palettes.pending;
    const label = normalized.charAt(0).toUpperCase() + normalized.slice(1);
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${classes}`}>
        {label}
      </span>
    );
  };

  const formatStatusLabel = (value) => {
    if (!value) return "N/A";
    const normalized = value.toLowerCase();
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  };

  if (loading) {
    return (
      <Background
        variant="gradientBlue"
        pattern="dots"
        floatingElements
        overlay
      >
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8">
          <div className="flex flex-col items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 sm:border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-sm sm:text-base text-gray-600 font-medium text-center">
              Loading store details...
            </p>
          </div>
        </div>
      </Background>
    );
  }

  if (!store) {
    return (
      <Background variant="gradientBlue" pattern="dots" floatingElements overlay>
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="bg-white/90 border border-gray-200 rounded-xl shadow-sm p-8 text-center max-w-md">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Store Unavailable</h2>
            <p className="text-gray-600 mb-4">
              {error || "We couldn't find the store details you're looking for."}
            </p>
            <button
              onClick={() => navigate("/superadmin")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
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
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Dashboard
            </button>
          </div>
        </div>
      </Background>
    );
  }

  return (
    <Background variant="gradientBlue" pattern="dots" floatingElements overlay>
      <div className="min-h-screen p-3 sm:p-4 md:p-6 lg:p-8 bg-gradient-to-br from-gray-50 via-blue-50/30 to-green-50/20">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/50 p-4 sm:p-5 md:p-6 mb-4 sm:mb-5 md:mb-6 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg ring-2 sm:ring-4 ring-blue-100/50 flex-shrink-0">
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent break-words">
                    Tenant Review
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">
                    Comprehensive business verification details
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate("/superadmin", { state: { activeTab: "stores" } })}
                className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-white border border-gray-300 rounded-lg text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm hover:shadow-md w-full sm:w-auto touch-manipulation"
              >
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                <span className="whitespace-nowrap">Back to List</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4 mb-4 sm:mb-5 md:mb-6 shadow-sm">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 text-red-600"
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
                </div>
                <span className="text-sm sm:text-base text-red-700 font-medium break-words">
                  {error}
                </span>
              </div>
            </div>
          )}

          {/* Overview */}
          <section className="mb-4 sm:mb-5 md:mb-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/50 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50/50 via-blue-50/30 to-blue-50/20 border-b border-gray-200/50 px-4 sm:px-5 md:px-6 py-3 sm:py-3.5 md:py-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                    <svg
                      className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Personal Overview
                  </h2>
                </div>
              </div>
              <div className="p-4 sm:p-5 md:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="group bg-gradient-to-br from-blue-50/50 to-indigo-50/30 rounded-xl p-3 sm:p-4 md:p-5 border border-blue-100/50 hover:border-blue-200 hover:shadow-md transition-all duration-300">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform flex-shrink-0">
                        <svg
                          className="w-5 h-5 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5 sm:mb-1">
                          Username
                        </p>
                        <p className="text-base sm:text-lg font-bold text-gray-900 break-words">
                          {store.account?.username || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="group bg-gradient-to-br from-blue-50/50 to-blue-50/30 rounded-xl p-3 sm:p-4 md:p-5 border border-blue-100/50 hover:border-blue-200 hover:shadow-md transition-all duration-300">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform flex-shrink-0">
                        <svg
                          className="w-5 h-5 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5 sm:mb-1">
                          Email
                        </p>
                        <p className="text-base sm:text-lg font-bold text-gray-900 break-all">
                          {store.email || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="group bg-gradient-to-br from-blue-50/50 to-indigo-50/30 rounded-xl p-3 sm:p-4 md:p-5 border border-blue-100/50 hover:border-blue-200 hover:shadow-md transition-all duration-300">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform flex-shrink-0">
                        <svg
                          className="w-5 h-5 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5 sm:mb-1">
                          Phone
                        </p>
                        <p className="text-base sm:text-lg font-bold text-gray-900 break-words">
                          {store.phone || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="group bg-gradient-to-br from-blue-50/50 to-indigo-50/30 rounded-xl p-3 sm:p-4 md:p-5 border border-blue-100/50 hover:border-blue-200 hover:shadow-md transition-all duration-300">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform flex-shrink-0">
                        <svg
                          className="w-5 h-5 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-600"
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
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5 sm:mb-1">
                          Store Type
                        </p>
                        <p className="text-base sm:text-lg font-bold text-gray-900 break-words">
                          {store.storeType || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Store Details */}
          <section className="mb-4 sm:mb-5 md:mb-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/50 overflow-hidden">
              <div className="bg-gradient-to-r from-green-50/50 via-green-50/30 to-green-50/20 border-b border-gray-200/50 px-4 sm:px-5 md:px-6 py-3 sm:py-3.5 md:py-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                    <svg
                      className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white"
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
                  <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Business Information
                  </h2>
                </div>
              </div>
              <div className="p-4 sm:p-5 md:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <div className="group bg-gradient-to-br from-green-50/50 to-emerald-50/30 rounded-xl p-3 sm:p-4 md:p-5 border border-green-100/50 hover:border-green-200 hover:shadow-md transition-all duration-300">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform flex-shrink-0">
                        <svg
                          className="w-5 h-5 sm:w-5 sm:h-5 md:w-6 md:h-6 text-green-600"
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
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5 sm:mb-1">
                          Store Name
                        </p>
                        <p className="text-base sm:text-lg font-bold text-gray-900 break-words">
                          {store.storeName || store.name || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="group bg-gradient-to-br from-green-50/50 to-green-50/30 rounded-xl p-3 sm:p-4 md:p-5 border border-green-100/50 hover:border-green-200 hover:shadow-md transition-all duration-300">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform flex-shrink-0">
                        <svg
                          className="w-5 h-5 sm:w-5 sm:h-5 md:w-6 md:h-6 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5 sm:mb-1">
                          Location
                        </p>
                        <p className="text-base sm:text-lg font-bold text-gray-900 break-words">
                          {store.location || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="group bg-gradient-to-br from-green-50/50 to-green-50/30 rounded-xl p-3 sm:p-4 md:p-5 border border-green-100/50 hover:border-green-200 hover:shadow-md transition-all duration-300">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform flex-shrink-0">
                        <svg
                          className="w-5 h-5 sm:w-5 sm:h-5 md:w-6 md:h-6 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5 sm:mb-1">
                          Established
                        </p>
                        <p className="text-base sm:text-lg font-bold text-gray-900 break-words">
                          {store.established || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Documents Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 md:gap-6 mb-4 sm:mb-5 md:mb-6">
            {/* Store Documents */}
            <section>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/50 overflow-hidden h-full">
                <div className="bg-gradient-to-r from-blue-50/50 via-blue-50/30 to-blue-50/20 border-b border-gray-200/50 px-4 sm:px-5 md:px-6 py-3 sm:py-3.5 md:py-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                      <svg
                        className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white"
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
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      Business Documents
                    </h2>
                  </div>
                </div>
                <div className="p-4 sm:p-5 md:p-6 space-y-2 sm:space-y-3">
                  {(store.documents || []).map((d) => (
                    <div
                      key={d.documentId || d.name}
                      className="flex items-center gap-3 md:gap-4 p-3 sm:p-3.5 md:p-4 bg-gradient-to-r from-blue-50/50 to-blue-50/30 rounded-xl border border-blue-100/50 hover:border-blue-200 transition-all duration-300 hover:shadow-md"
                    >
                      <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                        <svg
                          className="w-5 h-5 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-600"
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
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                            {d.name}
                          </p>
                          {renderStatusPill(d.verificationStatus)}
                        </div>
                        <p className="text-xs text-gray-600">
                          {d.documentType || "Document"} • Uploaded {formatDate(d.uploadedAt)}
                        </p>
                      </div>
                      <button
                        onClick={() => downloadDocument(d.documentId, d.name)}
                        disabled={downloadingId === d.documentId}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 disabled:opacity-60"
                      >
                        {downloadingId === d.documentId ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
                            Downloading
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
                                d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4"
                              />
                            </svg>
                            Download
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                  {(!store.documents || store.documents.length === 0) && (
                    <div className="text-center py-8 sm:py-10 md:py-12 text-gray-500">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto mb-3 sm:mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <svg
                          className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-gray-400"
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
                      </div>
                      <p className="text-sm sm:text-base font-medium">
                        No documents available
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Verified Documents */}
            <section>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/50 overflow-hidden h-full">
                <div className="bg-gradient-to-r from-green-50/50 via-green-50/30 to-green-50/20 border-b border-gray-200/50 px-4 sm:px-5 md:px-6 py-3 sm:py-3.5 md:py-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                      <svg
                        className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      Verified Documents
                    </h2>
                  </div>
                </div>
                <div className="p-4 sm:p-5 md:p-6 space-y-2 sm:space-y-3">
                  {(store.verifiedDocuments || []).map((d) => (
                    <div
                      key={d.documentId || d.name}
                      className="flex items-center gap-3 md:gap-4 p-3 sm:p-3.5 md:p-4 bg-gradient-to-r from-green-50/50 to-green-50/30 rounded-xl border border-green-100/50 hover:border-green-200 transition-all duration-300 hover:shadow-md"
                    >
                      <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                        <svg
                          className="w-5 h-5 sm:w-5 sm:h-5 md:w-6 md:h-6 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                            {d.name}
                          </p>
                          {renderStatusPill(d.verificationStatus || "approved")}
                        </div>
                        <p className="text-xs text-gray-600">
                          {d.documentType || "Document"} • Uploaded {formatDate(d.uploadedAt)}
                        </p>
                      </div>
                      <button
                        onClick={() => downloadDocument(d.documentId, d.name)}
                        disabled={downloadingId === d.documentId}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-green-700 border border-green-200 rounded-lg hover:bg-green-50 disabled:opacity-60"
                      >
                        {downloadingId === d.documentId ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></span>
                            Downloading
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
                                d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4"
                              />
                            </svg>
                            Download
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                  {(!store.verifiedDocuments ||
                    store.verifiedDocuments.length === 0) && (
                    <div className="text-center py-8 sm:py-10 md:py-12 text-gray-500">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto mb-3 sm:mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <svg
                          className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <p className="text-sm sm:text-base font-medium">
                        No verified documents
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* Account Details */}
          <section className="mb-4 sm:mb-5 md:mb-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/50 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50/50 via-blue-50/30 to-green-50/20 border-b border-gray-200/50 px-4 sm:px-5 md:px-6 py-3 sm:py-3.5 md:py-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-blue-500 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                    <svg
                      className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Account & Security
                  </h2>
                </div>
              </div>
              <div className="p-4 sm:p-5 md:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <div className="group bg-gradient-to-br from-blue-50/50 to-blue-50/30 rounded-xl p-3 sm:p-4 md:p-5 border border-blue-100/50 hover:border-blue-200 hover:shadow-md transition-all duration-300">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform flex-shrink-0">
                        <svg
                          className="w-5 h-5 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5 sm:mb-1">
                          Username
                        </p>
                        <p className="text-base sm:text-lg font-bold text-gray-900 break-words">
                          {store.account?.username || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="group bg-gradient-to-br from-green-50/50 to-green-50/30 rounded-xl p-3 sm:p-4 md:p-5 border border-green-100/50 hover:border-green-200 hover:shadow-md transition-all duration-300">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform flex-shrink-0">
                        <svg
                          className="w-5 h-5 sm:w-5 sm:h-5 md:w-6 md:h-6 text-green-600"
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
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5 sm:mb-1">
                          Password
                        </p>
                        <p className="text-base sm:text-lg font-bold text-gray-900 break-words">
                          {store.account?.passwordHint || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="group bg-gradient-to-br from-blue-50/50 to-blue-50/30 rounded-xl p-3 sm:p-4 md:p-5 border border-blue-100/50 hover:border-blue-200 hover:shadow-md transition-all duration-300">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform flex-shrink-0">
                        <svg
                          className="w-5 h-5 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5 sm:mb-1">
                          Last Login
                        </p>
                        <p className="text-base sm:text-lg font-bold text-gray-900 break-words">
                          {store.account?.lastLogin || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="group bg-gradient-to-br from-green-50/50 to-green-50/30 rounded-xl p-3 sm:p-4 md:p-5 border border-green-100/50 hover:border-green-200 hover:shadow-md transition-all duration-300">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform flex-shrink-0">
                        <svg
                          className="w-5 h-5 sm:w-5 sm:h-5 md:w-6 md:h-6 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5 sm:mb-1">
                          Created
                        </p>
                        <p className="text-base sm:text-lg font-bold text-gray-900 break-words">
                          {store.account?.createdAt || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="group bg-gradient-to-br from-blue-50/50 to-blue-50/30 rounded-xl p-3 sm:p-4 md:p-5 border border-blue-100/50 hover:border-blue-200 hover:shadow-md transition-all duration-300">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform flex-shrink-0">
                        <svg
                          className="w-5 h-5 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5 sm:mb-1">
                          Password Changed
                        </p>
                        <p className="text-base sm:text-lg font-bold text-gray-900 break-words">
                          {store.account?.lastPasswordChange || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="group bg-gradient-to-br from-green-50/50 to-green-50/30 rounded-xl p-3 sm:p-4 md:p-5 border border-green-100/50 hover:border-green-200 hover:shadow-md transition-all duration-300">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform flex-shrink-0">
                        <svg
                          className="w-5 h-5 sm:w-5 sm:h-5 md:w-6 md:h-6 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5 sm:mb-1">
                          Login Attempts
                        </p>
                        <p className="text-base sm:text-lg font-bold text-gray-900 break-words">
                          {store.account?.loginAttemptsToday ?? "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="group bg-gradient-to-br from-blue-50/50 to-green-50/30 rounded-xl p-3 sm:p-4 md:p-5 border border-blue-100/50 hover:border-blue-200 hover:shadow-md transition-all duration-300 sm:col-span-2 lg:col-span-3">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform flex-shrink-0">
                        <svg
                          className="w-5 h-5 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5 sm:mb-1">
                          Store Address
                        </p>
                        <p className="text-base sm:text-lg font-bold text-gray-900 break-words">
                          {store.account?.storeAddress || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="group bg-gradient-to-br from-green-50/50 to-green-50/30 rounded-xl p-3 sm:p-4 md:p-5 border border-green-100/50 hover:border-green-200 hover:shadow-md transition-all duration-300">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform flex-shrink-0">
                        <svg
                          className="w-5 h-5 sm:w-5 sm:h-5 md:w-6 md:h-6 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5 sm:mb-1">
                          Status
                        </p>
                        <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>
                          {formatStatusLabel(store.account?.status || store.verificationStatus)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="group bg-gradient-to-br from-blue-50/50 to-blue-50/30 rounded-xl p-3 sm:p-4 md:p-5 border border-blue-100/50 hover:border-blue-200 hover:shadow-md transition-all duration-300">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform flex-shrink-0">
                        <svg
                          className="w-5 h-5 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5 sm:mb-1">
                          Session Timeout
                        </p>
                        <p className="text-base sm:text-lg font-bold text-gray-900 break-words">
                          {store.account?.sessionTimeout || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Complete Verification Section */}
          <section className="mb-4 sm:mb-5 md:mb-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-blue-100/60 overflow-hidden">
              <div className="p-4 sm:p-5 md:p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5"
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
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">Verification Actions</h2>
                    <p className="text-sm text-gray-600">
                      Approvals and rejections now happen inside the Document Verification tab.
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Use the <span className="font-semibold text-gray-800">Document Verification</span> tab to review uploads,
                  update document statuses, and complete the final decision for this business. The information on this page
                  will automatically reflect those updates.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 text-xs font-medium">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    Current Status: {store.verificationStatus?.charAt(0).toUpperCase() + store.verificationStatus?.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </Background>
  );
}
