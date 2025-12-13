import React, { useState, useEffect } from "react";
import PageLayout from "../components/layout/PageLayout";
import NavAdmin from "../components/layout/Nav-Admin";
import Card from "../components/common/Card";
import Loader from "../components/common/Loader";
import { api } from "../lib/api";
import Button from "../components/common/Button";
import ProfileModal from "../components/modals/ProfileModal";
import BaseModal from "../components/modals/BaseModal";

// Icon Components
const UserIcon = (props) => (
  <svg
    className={`w-5 h-5 ${props.className || ""}`}
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
);

const EmailIcon = (props) => (
  <svg
    className={`w-5 h-5 ${props.className || ""}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
);

const PhoneIcon = (props) => (
  <svg
    className={`w-5 h-5 ${props.className || ""}`}
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
);

const CalendarIcon = (props) => (
  <svg
    className={`w-5 h-5 ${props.className || ""}`}
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
);

const StoreIcon = (props) => (
  <svg
    className={`w-5 h-5 ${props.className || ""}`}
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
);

const LocationIcon = (props) => (
  <svg
    className={`w-5 h-5 ${props.className || ""}`}
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
);

const RefreshIcon = () => (
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
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    />
  </svg>
);

const EditIcon = () => (
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
      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
    />
  </svg>
);

const LockIcon = () => (
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
      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
    />
  </svg>
);

const DownloadIcon = () => (
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
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
    />
  </svg>
);

// New QR Icon from the 'new-nigga-dave' branch
const QRIcon = () => (
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
      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h4a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
    />
  </svg>
);

// ---

// QR Code Logic Utility (Consolidated)
const getQrCodeData = (profileData) => {
  // 1. Get businessId, prioritizing profileData, then sessionStorage, then localStorage
  const businessId =
    profileData?.business?.business_id ||
    profileData?.user?.businessId ||
    JSON.parse(sessionStorage.getItem("user") || "{}")?.businessId ||
    JSON.parse(localStorage.getItem("user") || "{}")?.businessId;

  if (!businessId) return { url: "N/A", qrSrc: null, businessId: null };

  const url = new URL(window.location.origin + "/enter-store");
  url.searchParams.set("business_id", String(businessId));
  const urlString = url.toString();
  const data = encodeURIComponent(urlString);

  // Use a slightly larger size for better download quality, but display size remains 260x260
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${data}&qzone=2&format=png&_=${Date.now()}`;
  const downloadSrc = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${data}&qzone=2&format=png&_=${Date.now()}`;

  return { url: urlString, qrSrc, downloadSrc, businessId };
};

// ---

/**
 * Profile Page Component
 * Displays store and admin credentials information
 */
const Profile = () => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteState, setDeleteState] = useState({ status: "none" });
  const [deleteMessage, setDeleteMessage] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const normalizeDeletion = (del) => {
    if (!del) return { status: "none" };
    if (del.status === "cancelled") return { status: "none" };
    return del;
  };

  const fetchDeletionStatus = async () => {
    try {
      setDeleteLoading(true);
      const res = await api("/api/business/delete-request");
      const normalized = normalizeDeletion(res?.deletion);
      setDeleteState(normalized);
      setDeleteMessage(
        normalized.status === "pending" ? res?.message || "" : ""
      );
    } catch (e) {
      setDeleteError(
        e?.message || "Could not load deletion status. Please try again."
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
    fetchDeletionStatus();
  }, []);

  const normalizeBusiness = (business) => {
    if (!business) return null;

    const parts = (business.business_address || "")
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);

    // Remove trailing country if present
    while (parts.length && /philippines?/i.test(parts[parts.length - 1])) {
      parts.pop();
    }

    // Stored format (after trimming country): "<house>, <barangay>, <city>, <province>"
    const len = parts.length;
    const province = len >= 1 ? parts[len - 1] : "";
    const city = len >= 2 ? parts[len - 2] : "";
    const barangay = len >= 3 ? parts[len - 3] : "";
    const houseOrStreet =
      len > 3 ? parts.slice(0, len - 3).join(", ") : parts[0] || "";

    return {
      ...business,
      address_line: business.address_line || business.business_address || "",
      region:
        business.region ||
        business.regionName ||
        business.region_name ||
        business.region_name ||
        "",
      province: business.province || business.provinceName || province || "",
      city: business.city || business.cityName || city || "",
      barangay: business.barangay || business.barangayName || barangay || "",
      house_number:
        business.house_number || business.houseNumber || houseOrStreet || "",
    };
  };

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setError("");

      const token =
        sessionStorage.getItem("auth_token") ||
        localStorage.getItem("auth_token") ||
        localStorage.getItem("token");

      // Sync token to sessionStorage so future requests stay authenticated
      if (token && !sessionStorage.getItem("auth_token")) {
        sessionStorage.setItem("auth_token", token);
      }

      console.log("Fetching profile data from /auth/profile");

      // Fetch user profile data
      const response = await api("/auth/profile");

      const normalized = {
        ...response,
        business: normalizeBusiness(response.business),
      };

      // Derive region if missing using locations endpoint (province -> region)
      if (normalized.business && !normalized.business.region) {
        try {
          if (!locationsCacheRef.current) {
            const locations = await api("/location/locations");
            locationsCacheRef.current = locations;
          }
          const derivedRegion = deriveRegionFromLocations(
            locationsCacheRef.current,
            normalized.business.province,
            normalized.business.city
          );
          if (derivedRegion) {
            normalized.business.region = derivedRegion;
          }
        } catch (locErr) {
          console.warn("Failed to derive region from locations:", locErr);
        }
      }

      console.log("Profile data received:", normalized);
      setProfileData(normalized);
    } catch (err) {
      console.error("Failed to fetch profile data:", err);
      setError(
        "Failed to load profile information. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const deriveRegionFromLocations = (locationsData, provinceName, cityName) => {
    if (!locationsData || (!provinceName && !cityName)) return "";
    // locationsData structure: { [regionName]: { code, provinces: { [provinceName]: { ... } } } }
    const provinceLower = (provinceName || "").toLowerCase().trim();
    const cityLower = (cityName || "").toLowerCase().trim();

    for (const [regionName, regionData] of Object.entries(locationsData)) {
      for (const provinceKey of Object.keys(regionData.provinces || {})) {
        const provLower = provinceKey.toLowerCase();
        if (provinceLower && provLower === provinceLower) {
          return regionName;
        }
        // Some addresses might have city stored as "Province" due to parsing issues; try matching city against province names
        if (cityLower && provLower === cityLower) {
          return regionName;
        }
      }
    }
    return "";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDownloadExport = async () => {
    setDeleteError("");
    setDownloadLoading(true);
    try {
      const res = await api(
        "/api/business/delete-request/export",
        { method: "GET" },
        true
      );
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `transactions-export.${blob.type.includes("gzip") ? "gz" : "json"}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      setDeleteError(
        e?.message || "Failed to download export. Please try again."
      );
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleRequestDeletion = async () => {
    setDeleteError("");
    setDeleteMessage("");
    if (!password) {
      setDeleteError('Please enter your password to confirm deletion.');
      return;
    }
    setDeleteLoading(true);
    try {
      const res = await api("/api/business/delete-request", { 
        method: "POST",
        body: JSON.stringify({ password })
      });
      setDeleteState(res?.deletion || { status: "pending" });
      setDeleteMessage(
        res?.message || "Deletion request recorded with a 30-day grace period."
      );
      setShowDeleteConfirm(false);
      setPassword("");
    } catch (e) {
      setDeleteError(
        e?.message || "Could not request deletion. Please check your password and try again."
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCancelDeletion = async () => {
    setDeleteError("");
    setDeleteMessage("");
    setDeleteLoading(true);
    try {
      const res = await api("/api/business/delete-request/cancel", {
        method: "POST",
      });
      const normalized = normalizeDeletion(res?.deletion);
      setDeleteState(normalized);
      setDeleteMessage("");
    } catch (e) {
      setDeleteError(
        e?.message || "Could not cancel deletion. Please try again."
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDownloadQr = async () => {
    const { downloadSrc, businessId } = getQrCodeData(profileData);
    if (!downloadSrc) {
      alert("Business ID not found to generate QR code.");
      return;
    }

    try {
      // Fetch the image as a blob to handle CORS
      const response = await fetch(downloadSrc);
      if (!response.ok) {
        throw new Error('Failed to fetch QR code image');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const a = document.createElement("a");
      a.href = url;
      a.download = `store-${businessId || "qr"}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Clean up the object URL
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading QR code:', error);
      alert('Failed to download QR code. Please try again.');
    }
  };

  // Header actions with modern styling
  const headerActions = (
    <div className="flex items-center justify-end gap-2 sm:gap-3">
      <Button
        onClick={fetchProfileData}
        variant="secondary"
        size="sm"
        icon={<RefreshIcon />}
        iconPosition="left"
        className="whitespace-nowrap [&>span]:hidden sm:[&>span]:inline"
      >
        <span>Refresh</span>
      </Button>
      <Button
        variant="primary"
        size="sm"
        icon={<EditIcon />}
        iconPosition="left"
        onClick={() => setIsEditModalOpen(true)}
        className="whitespace-nowrap [&>span]:hidden sm:[&>span]:inline"
      >
        <span>Edit Profile</span>
      </Button>
    </div>
  );

  if (loading) {
    return (
      <PageLayout
        title="PROFILE"
        subtitle="Store and admin credentials"
        sidebar={<NavAdmin />}
        isSidebarOpen={isSidebarOpen}
        setSidebarOpen={setSidebarOpen}
        className="bg-gray-50"
      >
        <div className="flex justify-center items-center h-64">
          <Loader />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="PROFILE"
      subtitle=""
      sidebar={<NavAdmin />}
      headerActions={headerActions}
      isSidebarOpen={isSidebarOpen}
      setSidebarOpen={setSidebarOpen}
      className="bg-gray-50"
    >
      <ProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        userData={profileData?.user}
        businessData={profileData?.business}
      />
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {error && (
          <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-red-200/50">
            <div className="flex items-start gap-4 p-4">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
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
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-900 mb-1">
                  Error Loading Profile
                </h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </Card>
        )}

        {!loading && !error && !profileData && (
          <Card className="bg-gradient-to-br from-gray-50 to-blue-50/30 border-gray-200/50">
            <div className="p-8 md:p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <svg
                  className="w-10 h-10 text-gray-500"
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
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                No Profile Data Available
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Unable to load your profile information. Please try refreshing
                or check your connection.
              </p>
              <Button
                onClick={fetchProfileData}
                variant="primary"
                size="md"
                icon={<RefreshIcon />}
                iconPosition="left"
              >
                Try Again
              </Button>
            </div>
          </Card>
        )}

        {/* Profile Content - Only show when data is available */}
        {profileData && (
          <React.Fragment>
            {/* Modern Profile Header */}
            <Card className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-blue-200/50 overflow-hidden">
              <div className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                  <div className="relative">
                    <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center text-3xl md:text-4xl font-bold shadow-lg ring-4 ring-white/50">
                      {profileData?.user?.first_name
                        ?.charAt(0)
                        ?.toUpperCase() || "A"}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                      {profileData?.business?.business_name || "Admin User"}
                    </h1>
                    <p className="text-gray-600 mb-4 flex items-center gap-2">
                      <EmailIcon />
                      <span className="truncate">
                        {profileData?.user?.email || "N/A"}
                      </span>
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-800 border border-blue-200">
                        <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                          <StoreIcon className="w-3 h-3 text-blue-600" />
                        </div>
                        <span>
                          {profileData?.user?.role?.replace("_", " ").toUpperCase() || "ADMIN"}
                          {profileData?.business?.business_type && ` • ${profileData.business.business_type}`}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Admin Information */}
            <Card className="bg-white shadow-sm">
              <div className="p-6 md:p-8">
                <div className="flex items-center mb-6 pb-4 border-b border-gray-200">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl flex items-center justify-center mr-3">
                    <UserIcon />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Account Information
                    </h2>
                    <p className="text-sm text-gray-500">
                      Personal details and credentials
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-5">
                    <div className="group">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        First Name
                      </label>
                      <div className="flex items-center gap-3 bg-gradient-to-r from-gray-50 to-gray-100/50 px-4 py-3 rounded-xl border border-gray-200/50 group-hover:border-blue-300 transition-colors">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <UserIcon className="text-blue-600" />
                        </div>
                        <span className="text-gray-900 font-medium flex-1">
                          {profileData?.user?.first_name || "N/A"}
                        </span>
                      </div>
                    </div>

                    <div className="group">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Last Name
                      </label>
                      <div className="flex items-center gap-3 bg-gradient-to-r from-gray-50 to-gray-100/50 px-4 py-3 rounded-xl border border-gray-200/50 group-hover:border-blue-300 transition-colors">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <UserIcon className="text-blue-600" />
                        </div>
                        <span className="text-gray-900 font-medium flex-1">
                          {profileData?.user?.last_name || "N/A"}
                        </span>
                      </div>
                    </div>

                    <div className="group">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Email Address
                      </label>
                      <div className="flex items-center gap-3 bg-gradient-to-r from-gray-50 to-gray-100/50 px-4 py-3 rounded-xl border border-gray-200/50 group-hover:border-blue-300 transition-colors">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <EmailIcon className="text-blue-600" />
                        </div>
                        <span className="text-gray-900 font-medium flex-1 truncate">
                          {profileData?.user?.email || "N/A"}
                        </span>
                      </div>
                    </div>

                    <div className="group">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Role
                      </label>
                      <div className="flex items-center gap-3 bg-gradient-to-r from-gray-50 to-gray-100/50 px-4 py-3 rounded-xl border border-gray-200/50">
                        <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg
                            className="w-5 h-5 text-indigo-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                            />
                          </svg>
                        </div>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800 border border-blue-200 capitalize">
                          {profileData?.user?.role?.replace("_", " ") || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div className="group">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Contact Number
                      </label>
                      <div className="flex items-center gap-3 bg-gradient-to-r from-gray-50 to-gray-100/50 px-4 py-3 rounded-xl border border-gray-200/50 group-hover:border-blue-300 transition-colors">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <PhoneIcon className="text-green-600" />
                        </div>
                        <span className="text-gray-900 font-medium flex-1">
                          {profileData?.user?.contact_number || "N/A"}
                        </span>
                      </div>
                    </div>

                    <div className="group">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Account Created
                      </label>
                      <div className="flex items-center gap-3 bg-gradient-to-r from-gray-50 to-gray-100/50 px-4 py-3 rounded-xl border border-gray-200/50 group-hover:border-blue-300 transition-colors">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <CalendarIcon className="text-purple-600" />
                        </div>
                        <span className="text-gray-900 font-medium flex-1">
                          {formatDate(profileData?.user?.created_at)}
                        </span>
                      </div>
                    </div>

                    <div className="group">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Last Updated
                      </label>
                      <div className="flex items-center gap-3 bg-gradient-to-r from-gray-50 to-gray-100/50 px-4 py-3 rounded-xl border border-gray-200/50 group-hover:border-blue-300 transition-colors">
                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <CalendarIcon className="text-orange-600" />
                        </div>
                        <span className="text-gray-900 font-medium flex-1">
                          {formatDate(profileData?.user?.updated_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Store Entry QR for Customers (Adopted styling from new-nigga-dave) */}
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl flex items-center justify-center">
                      <QRIcon />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        Store Entry QR Code
                      </h3>
                      <p className="text-sm text-gray-500">
                        Share this QR code for customer self-checkout
                      </p>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-2xl p-6 border border-gray-200/50">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl blur-xl opacity-20"></div>
                        <img
                          src={getQrCodeData(profileData).qrSrc}
                          alt="Store Entry QR"
                          className="relative w-[260px] h-[260px] border-4 border-white rounded-2xl bg-white shadow-xl"
                        />
                      </div>
                      <div className="flex-1 space-y-4 min-w-0">
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                            QR Code URL
                          </label>
                          <div className="bg-white px-4 py-3 rounded-xl border border-gray-200 break-all text-sm text-gray-700 font-mono">
                            {getQrCodeData(profileData).url}
                          </div>
                        </div>
                        <Button
                          variant="primary"
                          size="md"
                          icon={<DownloadIcon />}
                          iconPosition="left"
                          onClick={handleDownloadQr}
                          className="w-full md:w-auto"
                        >
                          Download QR Code
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Store Information */}
            <Card className="bg-white shadow-sm">
              <div className="p-6 md:p-8">
                <div className="flex items-center mb-6 pb-4 border-b border-gray-200">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-xl flex items-center justify-center mr-3">
                    <StoreIcon />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Store Information
                    </h2>
                    <p className="text-sm text-gray-500">
                      Business details and credentials
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-5">
                    <div className="group">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Business Name
                      </label>
                      <div className="flex items-center gap-3 bg-gradient-to-r from-gray-50 to-gray-100/50 px-4 py-3 rounded-xl border border-gray-200/50 group-hover:border-green-300 transition-colors">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <StoreIcon className="text-green-600" />
                        </div>
                        <span className="text-gray-900 font-medium flex-1">
                          {profileData?.business?.business_name || "N/A"}
                        </span>
                      </div>
                    </div>

                    <div className="group">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Business Email
                      </label>
                      <div className="flex items-center gap-3 bg-gradient-to-r from-gray-50 to-gray-100/50 px-4 py-3 rounded-xl border border-gray-200/50 group-hover:border-green-300 transition-colors">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <EmailIcon className="text-blue-600" />
                        </div>
                        <span className="text-gray-900 font-medium flex-1 truncate">
                          {profileData?.business?.email || "N/A"}
                        </span>
                      </div>
                    </div>

                    <div className="group">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Region
                      </label>
                      <div className="flex items-center gap-3 bg-gradient-to-r from-gray-50 to-gray-100/50 px-4 py-3 rounded-xl border border-gray-200/50 group-hover:border-green-300 transition-colors">
                        <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <LocationIcon className="text-teal-600" />
                        </div>
                        <span className="text-gray-900 font-medium flex-1">
                          {profileData?.business?.region || "N/A"}
                        </span>
                      </div>
                    </div>

                    <div className="group">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Province
                      </label>
                      <div className="flex items-center gap-3 bg-gradient-to-r from-gray-50 to-gray-100/50 px-4 py-3 rounded-xl border border-gray-200/50 group-hover:border-green-300 transition-colors">
                        <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <LocationIcon className="text-emerald-600" />
                        </div>
                        <span className="text-gray-900 font-medium flex-1">
                          {profileData?.business?.province || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div className="group">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Business Type
                      </label>
                      <div className="flex items-center gap-3 bg-gradient-to-r from-gray-50 to-gray-100/50 px-4 py-3 rounded-xl border border-gray-200/50 group-hover:border-green-300 transition-colors">
                        <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg
                            className="w-5 h-5 text-emerald-600"
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
                        <span className="text-gray-900 font-medium flex-1">
                          {profileData?.business?.business_type || "N/A"}
                        </span>
                      </div>
                    </div>

                    <div className="group">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Business Location
                      </label>
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 px-4 py-3 rounded-xl border border-gray-200/50">
                        <div className="grid grid-cols-1 gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <LocationIcon className="text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <div className="text-xs text-gray-500 uppercase tracking-wide">
                                City/Municipality
                              </div>
                              <div className="text-gray-900 font-medium">
                                {profileData?.business?.city || "N/A"}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <LocationIcon className="text-indigo-600" />
                            </div>
                            <div className="flex-1">
                              <div className="text-xs text-gray-500 uppercase tracking-wide">
                                Barangay
                              </div>
                              <div className="text-gray-900 font-medium">
                                {profileData?.business?.barangay || "N/A"}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                              <LocationIcon className="text-purple-600" />
                            </div>
                            <div className="flex-1">
                              <div className="text-xs text-gray-500 uppercase tracking-wide">
                                House no./ Street Name / Landmark (optional)
                              </div>
                              <div className="text-gray-900 font-medium">
                                {[profileData?.business?.house_number, profileData?.business?.business_address, profileData?.business?.landmark]
                                  .filter(Boolean)
                                  .join(", ") || "N/A"}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Business Users */}
            {profileData?.business?.users &&
              profileData.business.users.length > 0 && (
                <>
                  {(() => {
                    const filteredBusinessUsers =
                      profileData.business.users.filter(
                        (user) =>
                          user.user_type_name === "admin" ||
                          user.user_type_name === "cashier" ||
                          user.role === "admin" ||
                          user.role === "cashier" ||
                          user.role === "business_owner"
                      );
                    return (
                      <Card className="bg-white shadow-sm">
                        <div className="p-6 md:p-8">
                          <div className="flex items-center mb-6 pb-4 border-b border-gray-200">
                            <div className="w-10 h-10 bg-gradient-to-br bg-blue-500 text-white rounded-xl flex items-center justify-center mr-3">
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
                                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                />
                              </svg>
                            </div>
                            <div>
                              <h2 className="text-xl font-bold text-gray-900">
                                Business Team
                              </h2>
                              <p className="text-sm text-gray-500">
                                All users associated with this business (
                                {filteredBusinessUsers.length} total)
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                            {filteredBusinessUsers.map((user, index) => (
                              <div
                                key={user.user_id}
                                className="group bg-gradient-to-br from-white to-gray-50/50 rounded-2xl p-5 border border-gray-200/50 hover:border-purple-300 hover:shadow-lg transition-all duration-300"
                              >
                                <div className="flex items-center mb-4">
                                  <div className="relative">
                                    <div className="w-12 h-12 bg-gradient-to-br bg-blue-500 text-white rounded-xl flex items-center justify-center text-lg font-bold shadow-md ring-2 ring-white">
                                      {user.username
                                        ?.charAt(0)
                                        ?.toUpperCase() || "U"}
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                                  </div>
                                  <div className="ml-3 flex-1 min-w-0">
                                    <h4 className="font-bold text-gray-900 truncate">
                                      {user.username}
                                    </h4>
                                    <span
                                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold mt-1 ${
                                        user.user_type_name === "admin" ||
                                        user.role === "business_owner"
                                          ? "bg-red-100 text-red-800 border border-red-200"
                                          : user.user_type_name === "cashier" ||
                                            user.role === "cashier"
                                          ? "bg-green-100 text-green-800 border border-green-200"
                                          : "bg-gray-100 text-gray-800 border border-gray-200"
                                      }`}
                                    >
                                      {user.user_type_name || user.role}
                                    </span>
                                  </div>
                                </div>

                                <div className="space-y-3 text-sm">
                                  <div className="flex items-start gap-2">
                                    <EmailIcon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                    <div className="min-w-0 flex-1">
                                      <div className="text-xs text-gray-500 mb-0.5">
                                        Email
                                      </div>
                                      <div className="font-medium text-gray-900 truncate">
                                        {user.email}
                                      </div>
                                    </div>
                                  </div>
                                  {user.contact_number && (
                                    <div className="flex items-start gap-2">
                                      <PhoneIcon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                      <div className="min-w-0 flex-1">
                                        <div className="text-xs text-gray-500 mb-0.5">
                                          Contact
                                        </div>
                                        <div className="font-medium text-gray-900">
                                          {user.contact_number}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  <div className="flex items-start gap-2">
                                    <CalendarIcon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                    <div className="min-w-0 flex-1">
                                      <div className="text-xs text-gray-500 mb-0.5">
                                        Joined
                                      </div>
                                      <div className="font-medium text-gray-900">
                                        {formatDate(user.created_at)}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </Card>
                    );
                  })()}
                </>
              )}

              {/* Store Deletion Section */}
              <Card className="border-red-100 border-2 mt-6">
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-red-900">Delete Your Store</h3>
                      <p className="text-sm text-red-600">This action cannot be undone after 30 days</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-gray-700">
                      Download all transactions then schedule deletion with a 30-day recovery window.
                    </p>

                    {deleteMessage && (
                      <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                        {deleteMessage}
                      </div>
                    )}
                    {deleteError && (
                      <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                        {deleteError}
                      </div>
                    )}

                    {deleteState.status === "pending" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-700 p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-800">Status:</span>
                          <span className="px-2 py-1 rounded-full border text-xs">
                            {deleteState.status || "none"}
                          </span>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-800">Scheduled:</span>{" "}
                          {formatDate(deleteState.scheduledFor)}
                        </div>
                        <div>
                          <span className="font-semibold text-gray-800">Requested:</span>{" "}
                          {formatDate(deleteState.requestedAt)}
                        </div>
                        <div>
                          <span className="font-semibold text-gray-800">Export ready:</span>{" "}
                          {formatDate(deleteState.exportReadyAt) || "N/A"}
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      {!showDeleteConfirm ? (
                        <div className="flex flex-wrap gap-3">
                          <Button
                            label={
                              downloadLoading ? "Preparing..." : "Download transactions"
                            }
                            variant="secondary"
                            onClick={handleDownloadExport}
                            disabled={downloadLoading}
                            icon={<DownloadIcon />}
                          />
                          <Button
                            label="Delete store"
                            variant="danger"
                            onClick={() => setShowDeleteConfirm(true)}
                            disabled={deleteLoading || deleteState.status === "pending"}
                          />
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Enter your password to confirm
                            </label>
                            <input
                              type="password"
                              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                              placeholder="Your account password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              disabled={deleteLoading}
                            />
                          </div>
                          <div className="flex flex-wrap gap-3">
                            <Button
                              label="Cancel"
                              variant="secondary"
                              onClick={() => {
                                setShowDeleteConfirm(false);
                                setPassword("");
                                setDeleteError("");
                              }}
                              disabled={deleteLoading}
                            />
                            <Button
                              label={
                                deleteLoading ? "Processing..." : "Confirm Deletion"
                              }
                              variant="danger"
                              onClick={handleRequestDeletion}
                              disabled={deleteLoading || !password}
                            />
                          </div>
                        </div>
                      )}

                      {deleteState.status === "pending" && (
                        <Button
                          label="Cancel Deletion"
                          variant="secondary"
                          onClick={handleCancelDeletion}
                          disabled={deleteLoading}
                          className="mt-2"
                        />
                      )}

                      <p className="text-sm text-gray-500 mt-2">
                        You can recover the account within 30 days. After that, the store is permanently removed.
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </React.Fragment>
          )}
        </div>
    </PageLayout>
  );
};

export default Profile;
