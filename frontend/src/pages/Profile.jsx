import React, { useState, useEffect } from "react";
import PageLayout from "../components/layout/PageLayout";
import NavAdmin from "../components/layout/Nav-Admin";
import Card from "../components/common/Card";
import Loader from "../components/common/Loader";
import { api } from "../lib/api";
import Button from "../components/common/Button";

/**
 * Profile Page Component
 * Displays store and admin credentials information
 */
const Profile = () => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setError("");

      const token = sessionStorage.getItem("auth_token");
      console.log("Auth token:", token ? "Present" : "Missing");

      if (!token) {
        throw new Error("No authentication token found");
      }

      console.log("Fetching profile data from /api/auth/profile");

      // Fetch user profile data
      const response = await api("/api/auth/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Profile data received:", response);
      setProfileData(response);
    } catch (err) {
      console.error("Failed to fetch profile data:", err);
      setError(
        "Failed to load profile information. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
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

  // Header actions moved from body into the page header
  const headerActions = (
    <div className="flex flex-wrap gap-3">
      <button
        onClick={fetchProfileData}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
      >
        Refresh Profile
      </button>
      <button
        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        onClick={() =>
          alert("Change password functionality would be implemented here")
        }
      >
        Change Password
      </button>
      <button
        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        onClick={() =>
          alert("Edit profile functionality would be implemented here")
        }
      >
        Edit Profile
      </button>
    </div>
  );

  if (loading) {
    return (
      <PageLayout
        title="PROFILE"
        subtitle="Store and admin credentials"
        sidebar={<NavAdmin />}
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
      subtitle="Store and admin credentials"
      sidebar={<NavAdmin />}
      headerActions={headerActions}
      className="bg-gray-50"
    >
      <div className="p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-red-400 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && !profileData && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3v18m0-18a4 4 0 0 1 4 4v1a4 4 0 0 1-4 4 4 4 0 0 1-4-4V7a4 4 0 0 1 4-4z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Profile Data Available
            </h3>
            <p className="text-gray-600 mb-4">
              Unable to load your profile information.
            </p>
            <button
              onClick={fetchProfileData}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Profile Content - Only show when data is available */}
        {profileData && (
          <React.Fragment>
            {/* Admin Information */}
            <Card className="bg-white shadow-sm">
              <div className="p-6">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-lg font-semibold mr-4">
                    {profileData?.user?.username?.charAt(0)?.toUpperCase() ||
                      "A"}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Admin Information
                    </h2>
                    <p className="text-gray-600">
                      Account and login credentials
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Username
                      </label>
                      <div className="bg-gray-50 px-3 py-2 rounded-lg border">
                        {profileData?.user?.username || "N/A"}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                      </label>
                      <div className="bg-gray-50 px-3 py-2 rounded-lg border">
                        {profileData?.user?.email || "N/A"}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role
                      </label>
                      <div className="bg-gray-50 px-3 py-2 rounded-lg border">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                          {profileData?.user?.role || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contact Number
                      </label>
                      <div className="bg-gray-50 px-3 py-2 rounded-lg border">
                        {profileData?.user?.contact_number || "N/A"}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Account Created
                      </label>
                      <div className="bg-gray-50 px-3 py-2 rounded-lg border">
                        {formatDate(profileData?.user?.created_at)}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Updated
                      </label>
                      <div className="bg-gray-50 px-3 py-2 rounded-lg border">
                        {formatDate(profileData?.user?.updated_at)}
                      </div>
                    </div>
                  </div>
                </div>

            {/* Store Entry QR for Customers */}
            <div className="mt-8">
              <div className="text-lg font-semibold text-gray-900 mb-2">Store Entry QR</div>
              <div className="text-gray-600 mb-3">Customers scan this to start self-checkout in your store.</div>
              <div className="flex items-start gap-4 flex-wrap">
                <img
                  src={(function(){
                    const businessId = profileData?.business?.business_id || profileData?.user?.businessId || JSON.parse(sessionStorage.getItem('user')||'{}')?.businessId;
                    const url = new URL(window.location.origin + '/enter-store');
                    if (businessId) url.searchParams.set('business_id', String(businessId));
                    const data = encodeURIComponent(url.toString());
                    return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${data}&qzone=2&format=png&_=${Date.now()}`;
                  })()}
                  alt="Store Entry QR"
                  className="w-[260px] h-[260px] border rounded-xl bg-white"
                />
                <div className="space-y-2">
                  <div className="text-sm text-gray-700 break-all">
                    {(function(){
                      const businessId = profileData?.business?.business_id || profileData?.user?.businessId || JSON.parse(sessionStorage.getItem('user')||'{}')?.businessId;
                      const url = new URL(window.location.origin + '/enter-store');
                      if (businessId) url.searchParams.set('business_id', String(businessId));
                      return url.toString();
                    })()}
                  </div>
                  <Button
                    label="Download PNG"
                    variant="primary"
                    onClick={() => {
                      const businessId = profileData?.business?.business_id || profileData?.user?.businessId || JSON.parse(sessionStorage.getItem('user')||'{}')?.businessId;
                      const url = new URL(window.location.origin + '/enter-store');
                      if (businessId) url.searchParams.set('business_id', String(businessId));
                      const data = encodeURIComponent(url.toString());
                      const src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${data}&qzone=2&format=png&_=${Date.now()}`;
                      const a = document.createElement('a');
                      a.href = src;
                      a.download = `store-${businessId||'qr'}.png`;
                      a.target = '_blank';
                      a.rel = 'noopener';
                      a.click();
                    }}
                  />
                </div>
              </div>
            </div>
              </div>
            </Card>

            {/* Store Information */}
            <Card className="bg-white shadow-sm">
              <div className="p-6">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center text-lg font-semibold mr-4">
                    <svg
                      width="24"
                      height="24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M3 21h18l-9-18-9 18zM12 9v4m0 4h.01" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Store Information
                    </h2>
                    <p className="text-gray-600">
                      Business details and credentials
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Business Name
                      </label>
                      <div className="bg-gray-50 px-3 py-2 rounded-lg border">
                        {profileData?.business?.business_name || "N/A"}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Business Type
                      </label>
                      <div className="bg-gray-50 px-3 py-2 rounded-lg border">
                        {profileData?.business?.business_type || "N/A"}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Country
                      </label>
                      <div className="bg-gray-50 px-3 py-2 rounded-lg border">
                        {profileData?.business?.country || "N/A"}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Business Email
                      </label>
                      <div className="bg-gray-50 px-3 py-2 rounded-lg border">
                        {profileData?.business?.email || "N/A"}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Business Address
                      </label>
                      <div className="bg-gray-50 px-3 py-2 rounded-lg border">
                        {profileData?.business?.business_address || "N/A"}
                        {profileData?.business?.house_number &&
                          `, ${profileData.business.house_number}`}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mobile Number
                      </label>
                      <div className="bg-gray-50 px-3 py-2 rounded-lg border">
                        {profileData?.business?.mobile || "N/A"}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Business Established
                      </label>
                      <div className="bg-gray-50 px-3 py-2 rounded-lg border">
                        {formatDate(profileData?.business?.created_at)}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Updated
                      </label>
                      <div className="bg-gray-50 px-3 py-2 rounded-lg border">
                        {formatDate(profileData?.business?.updated_at)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Business Users */}
            {profileData?.business?.users &&
              profileData.business.users.length > 0 && (
                <Card className="bg-white shadow-sm">
                  <div className="p-6">
                    <div className="flex items-center mb-6">
                      <div className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center text-lg font-semibold mr-4">
                        <svg
                          width="24"
                          height="24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                          Business Team
                        </h2>
                        <p className="text-gray-600">
                          All users associated with this business (
                          {profileData.business.total_users} total)
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {profileData.business.users.map((user, index) => (
                        <div
                          key={user.user_id}
                          className="bg-gray-50 rounded-lg p-4 border"
                        >
                          <div className="flex items-center mb-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                              {user.username?.charAt(0)?.toUpperCase() || "U"}
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {user.username}
                              </h4>
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  user.user_type_name === "admin" ||
                                  user.role === "business_owner"
                                    ? "bg-red-100 text-red-800"
                                    : user.user_type_name === "cashier" ||
                                      user.role === "cashier"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {user.user_type_name || user.role}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="text-gray-600">Email:</span>
                              <div className="font-medium text-gray-900">
                                {user.email}
                              </div>
                            </div>
                            {user.contact_number && (
                              <div>
                                <span className="text-gray-600">Contact:</span>
                                <div className="font-medium text-gray-900">
                                  {user.contact_number}
                                </div>
                              </div>
                            )}
                            <div>
                              <span className="text-gray-600">Joined:</span>
                              <div className="font-medium text-gray-900">
                                {formatDate(user.created_at)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              )}

            {/* Actions moved to header */}
          </React.Fragment>
        )}
      </div>
    </PageLayout>
  );
};

export default Profile;
