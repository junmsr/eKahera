import React, { useState } from "react";
import PageLayout from "../components/layout/PageLayout";
import DemoNav from "../components/layout/DemoNav"; // Keeping your DemoNav
import Card from "../components/common/Card";
import Button from "../components/common/Button"; // Assuming this exists based on source

// --- ICONS (Copied from Profile.jsx) ---
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

// --- MOCK DATA ---
const MOCK_PROFILE = {
  user: {
    first_name: "Demo",
    last_name: "Admin",
    email: "admin@demostore.com",
    role: "business_owner",
    contact_number: "09123456789",
    created_at: "2024-01-15T09:00:00Z",
    updated_at: "2025-10-20T14:30:00Z",
    businessId: 101,
  },
  business: {
    business_id: 101,
    business_name: "Demo Store Inc.",
    business_type: "Retail",
    email: "contact@demostore.com",
    region: "Region V (Bicol Region)",
    province: "Albay",
    city: "Legazpi City",
    barangay: "Bitano",
    house_number: "Unit 123, Commercial Bldg",
    users: [
      {
        user_id: 1,
        username: "owner_demo",
        first_name: "Demo",
        last_name: "Owner",
        email: "owner@demo.com",
        role: "business_owner",
        user_type_name: "admin",
        contact_number: "09123456789",
        created_at: "2024-01-15T09:00:00Z",
      },
      {
        user_id: 2,
        username: "cashier_jane",
        first_name: "Jane",
        last_name: "Doe",
        email: "jane@demo.com",
        role: "cashier",
        user_type_name: "cashier",
        contact_number: "09987654321",
        created_at: "2024-02-01T08:00:00Z",
      },
      {
        user_id: 3,
        username: "admin_assistant",
        first_name: "John",
        last_name: "Smith",
        email: "john@demo.com",
        role: "admin",
        user_type_name: "admin",
        contact_number: "09112223333",
        created_at: "2024-03-10T10:00:00Z",
      },
    ],
  },
};

// --- HELPERS ---
const getQrCodeData = (profileData) => {
  const businessId =
    profileData?.business?.business_id ||
    profileData?.user?.businessId ||
    "demo";
  const urlString = `https://your-app-url.com/enter-store?business_id=${businessId}`;
  const data = encodeURIComponent(urlString);
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${data}&qzone=2&format=png`;
  return { url: urlString, qrSrc, businessId };
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export default function DemoProfile() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // Handlers for demo purposes only
  const handleDemoAction = (action) => {
    alert(`${action} is disabled in Demo Mode.`);
  };

  const headerActions = (
    <div className="flex items-center justify-end gap-2 sm:gap-3">
      <Button
        onClick={() => window.location.reload()}
        variant="secondary"
        size="sm"
        icon={<RefreshIcon />}
        iconPosition="left"
        className="whitespace-nowrap [&>span]:hidden sm:[&>span]:inline"
      >
        <span>Refresh</span>
      </Button>
      <Button
        onClick={() => handleDemoAction("Change Password")}
        variant="secondary"
        size="sm"
        icon={<LockIcon />}
        iconPosition="left"
        className="whitespace-nowrap [&>span]:hidden sm:[&>span]:inline"
      >
        <span>Change Password</span>
      </Button>
    </div>
  );

  return (
    <PageLayout
      title="PROFILE (DEMO)"
      subtitle="Store and admin credentials"
      sidebar={<DemoNav />}
      headerActions={headerActions}
      isSidebarOpen={isSidebarOpen}
      setSidebarOpen={setSidebarOpen}
      className="bg-gray-50"
    >
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Modern Profile Header */}
        <Card className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-blue-200/50 overflow-hidden">
          <div className="p-6 md:p-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6 lg:gap-8">
              {/* QR Code Section */}
              <div className="flex-shrink-0 w-full lg:w-auto">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-500 rounded-2xl blur-xl opacity-30 group-hover:opacity-40 transition-opacity duration-300"></div>
                      <div className="relative bg-white p-3 rounded-xl shadow-md">
                        <img
                          src={getQrCodeData(MOCK_PROFILE).qrSrc}
                          alt="Store Entry QR Code"
                          className="w-[180px] h-[180px] md:w-[200px] md:h-[200px] rounded-lg"
                        />
                      </div>
                    </div>
                    <Button
                      variant="primary"
                      size="md"
                      icon={<DownloadIcon />}
                      iconPosition="left"
                      onClick={() => handleDemoAction("Download QR")}
                      className="w-full min-w-[200px] shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      Download QR Code
                    </Button>
                  </div>
                </div>
              </div>

              {/* Store Information Section */}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                  {MOCK_PROFILE.business.business_name}
                </h1>
                <p className="text-gray-600 mb-4 flex items-center gap-2">
                  <EmailIcon />
                  <span className="truncate">{MOCK_PROFILE.user.email}</span>
                </p>
                <div className="flex flex-wrap gap-3">
                  <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-800 border border-blue-200">
                    <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                      <StoreIcon className="w-3 h-3 text-blue-600" />
                    </div>
                    <span>
                      {MOCK_PROFILE.user.role.replace("_", " ").toUpperCase()} •{" "}
                      {MOCK_PROFILE.business.business_type}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Account Information */}
        <Card className="bg-white shadow-sm">
          <div className="p-6 md:p-8">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
              <div className="flex items-center">
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
              <button
                onClick={() => handleDemoAction("Edit Account")}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Edit Account Information"
              >
                <EditIcon />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-5">
                <div className="group">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    First Name
                  </label>
                  <div className="flex items-center gap-3 bg-gradient-to-r from-gray-50 to-gray-100/50 px-4 py-3 rounded-xl border border-gray-200/50 hover:border-blue-300 transition-colors">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <UserIcon className="text-blue-600" />
                    </div>
                    <span className="text-gray-900 font-medium flex-1">
                      {MOCK_PROFILE.user.first_name}
                    </span>
                  </div>
                </div>

                <div className="group">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Last Name
                  </label>
                  <div className="flex items-center gap-3 bg-gradient-to-r from-gray-50 to-gray-100/50 px-4 py-3 rounded-xl border border-gray-200/50 hover:border-blue-300 transition-colors">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <UserIcon className="text-blue-600" />
                    </div>
                    <span className="text-gray-900 font-medium flex-1">
                      {MOCK_PROFILE.user.last_name}
                    </span>
                  </div>
                </div>

                <div className="group">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Email Address
                  </label>
                  <div className="flex items-center gap-3 bg-gradient-to-r from-gray-50 to-gray-100/50 px-4 py-3 rounded-xl border border-gray-200/50 hover:border-blue-300 transition-colors">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <EmailIcon className="text-blue-600" />
                    </div>
                    <span className="text-gray-900 font-medium flex-1 truncate">
                      {MOCK_PROFILE.user.email}
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
                      {MOCK_PROFILE.user.role.replace("_", " ")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="group">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Contact Number
                  </label>
                  <div className="flex items-center gap-3 bg-gradient-to-r from-gray-50 to-gray-100/50 px-4 py-3 rounded-xl border border-gray-200/50 hover:border-blue-300 transition-colors">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <PhoneIcon className="text-green-600" />
                    </div>
                    <span className="text-gray-900 font-medium flex-1">
                      {MOCK_PROFILE.user.contact_number}
                    </span>
                  </div>
                </div>

                <div className="group">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Account Created
                  </label>
                  <div className="flex items-center gap-3 bg-gradient-to-r from-gray-50 to-gray-100/50 px-4 py-3 rounded-xl border border-gray-200/50 hover:border-blue-300 transition-colors">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CalendarIcon className="text-purple-600" />
                    </div>
                    <span className="text-gray-900 font-medium flex-1">
                      {formatDate(MOCK_PROFILE.user.created_at)}
                    </span>
                  </div>
                </div>

                <div className="group">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Last Updated
                  </label>
                  <div className="flex items-center gap-3 bg-gradient-to-r from-gray-50 to-gray-100/50 px-4 py-3 rounded-xl border border-gray-200/50 hover:border-blue-300 transition-colors">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CalendarIcon className="text-orange-600" />
                    </div>
                    <span className="text-gray-900 font-medium flex-1">
                      {formatDate(MOCK_PROFILE.user.updated_at)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Store Information */}
        <Card className="bg-white shadow-sm">
          <div className="p-6 md:p-8">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
              <div className="flex items-center">
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
              <button
                onClick={() => handleDemoAction("Edit Store")}
                className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                title="Edit Store Information"
              >
                <EditIcon />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-5">
                <div className="group">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Business Name
                  </label>
                  <div className="flex items-center gap-3 bg-gradient-to-r from-gray-50 to-gray-100/50 px-4 py-3 rounded-xl border border-gray-200/50 hover:border-green-300 transition-colors">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <StoreIcon className="text-green-600" />
                    </div>
                    <span className="text-gray-900 font-medium flex-1">
                      {MOCK_PROFILE.business.business_name}
                    </span>
                  </div>
                </div>

                <div className="group">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Business Email
                  </label>
                  <div className="flex items-center gap-3 bg-gradient-to-r from-gray-50 to-gray-100/50 px-4 py-3 rounded-xl border border-gray-200/50 hover:border-green-300 transition-colors">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <EmailIcon className="text-blue-600" />
                    </div>
                    <span className="text-gray-900 font-medium flex-1 truncate">
                      {MOCK_PROFILE.business.email}
                    </span>
                  </div>
                </div>

                <div className="group">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Region
                  </label>
                  <div className="flex items-center gap-3 bg-gradient-to-r from-gray-50 to-gray-100/50 px-4 py-3 rounded-xl border border-gray-200/50 hover:border-green-300 transition-colors">
                    <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <LocationIcon className="text-teal-600" />
                    </div>
                    <span className="text-gray-900 font-medium flex-1">
                      {MOCK_PROFILE.business.region}
                    </span>
                  </div>
                </div>

                <div className="group">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Province
                  </label>
                  <div className="flex items-center gap-3 bg-gradient-to-r from-gray-50 to-gray-100/50 px-4 py-3 rounded-xl border border-gray-200/50 hover:border-green-300 transition-colors">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <LocationIcon className="text-emerald-600" />
                    </div>
                    <span className="text-gray-900 font-medium flex-1">
                      {MOCK_PROFILE.business.province}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="group">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Business Type
                  </label>
                  <div className="flex items-center gap-3 bg-gradient-to-r from-gray-50 to-gray-100/50 px-4 py-3 rounded-xl border border-gray-200/50">
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
                      {MOCK_PROFILE.business.business_type}
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
                            {MOCK_PROFILE.business.city}
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
                            {MOCK_PROFILE.business.barangay}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                          <LocationIcon className="text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs text-gray-500 uppercase tracking-wide">
                            House no./ Street Name
                          </div>
                          <div className="text-gray-900 font-medium">
                            {MOCK_PROFILE.business.house_number}
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
                  {MOCK_PROFILE.business.users.length} total)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {MOCK_PROFILE.business.users.map((user) => (
                <div
                  key={user.user_id}
                  className="group bg-gradient-to-br from-white to-gray-50/50 rounded-2xl p-5 border border-gray-200/50 hover:border-purple-300 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-center mb-4">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br bg-blue-500 text-white rounded-xl flex items-center justify-center text-lg font-bold shadow-md ring-2 ring-white">
                        {user.first_name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 truncate">
                        {user.first_name} {user.last_name}
                      </h4>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold mt-1 ${
                          user.role === "business_owner" ||
                          user.role === "admin"
                            ? "bg-red-100 text-red-800 border border-red-200"
                            : "bg-green-100 text-green-800 border border-green-200"
                        }`}
                      >
                        {user.role.replace("_", " ")}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <UserIcon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs text-gray-500 mb-0.5">
                          Username
                        </div>
                        <div className="font-medium text-gray-900 truncate">
                          {user.username}
                        </div>
                      </div>
                    </div>
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

        {/* Store Deletion Section */}
        <Card className="border-red-100 border-2 mt-6">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <svg
                  className="w-6 h-6 text-red-600"
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
              </div>
              <div>
                <h3 className="text-lg font-bold text-red-900">
                  Delete Your Store
                </h3>
                <p className="text-sm text-red-600">
                  This action cannot be undone after 30 days
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-gray-700">
                Download all transactions then schedule deletion with a 30-day
                recovery window.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  label="Download transactions"
                  variant="secondary"
                  onClick={() => handleDemoAction("Download Export")}
                  icon={<DownloadIcon />}
                />
                <Button
                  label="Delete store"
                  variant="danger"
                  onClick={() => handleDemoAction("Delete Store")}
                />
              </div>
            </div>
          </div>
        </Card>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 text-center">
          <strong>Demo Mode:</strong> This profile is read-only. Data changes
          and deletions are simulated or disabled.
        </div>
      </div>
    </PageLayout>
  );
}
