import React, { useState, useEffect } from "react";
import Button from "../common/Button";
import FormField from "../common/FormField";
import BaseModal from "./BaseModal";
import { api } from "../../lib/api";

/**
 * ProfileModal Component
 * Modern, trending UI/UX design with glassmorphism and animations
 */
const ProfileModal = ({ isOpen, onClose, userData }) => {
  const [profileData, setProfileData] = useState({
    username: userData?.username || "",
    email: userData?.email || "",
    contact_number: userData?.contact_number || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [activeTab, setActiveTab] = useState("account");

  useEffect(() => {
    if (userData) {
      setProfileData({
        username: userData?.username || "",
        email: userData?.email || "",
        contact_number: userData?.contact_number || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setMessage("");
      setError("");
      setErrors({});
      setTouched({});
      setActiveTab("account");
    }
  }, [userData, isOpen]);

  const validateField = (name, value) => {
    const newErrors = { ...errors };

    switch (name) {
      case "username":
        if (!value.trim()) {
          newErrors.username = "Username is required";
        } else if (value.trim().length < 2) {
          newErrors.username = "Username must be at least 2 characters";
        } else {
          delete newErrors.username;
        }
        break;

      case "email":
        if (!value.trim()) {
          newErrors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          newErrors.email = "Please enter a valid email";
        } else {
          delete newErrors.email;
        }
        break;

      case "contact_number":
        if (value && value.trim().length < 7) {
          newErrors.contact_number = "Phone number must be at least 7 digits";
        } else {
          delete newErrors.contact_number;
        }
        break;

      case "currentPassword":
        if (profileData.newPassword && !value) {
          newErrors.currentPassword =
            "Current password is required to change password";
        } else {
          delete newErrors.currentPassword;
        }
        break;

      case "newPassword":
        if (value && value.length < 6) {
          newErrors.newPassword = "Password must be at least 6 characters";
        } else {
          delete newErrors.newPassword;
        }
        break;

      case "confirmPassword":
        if (value && value !== profileData.newPassword) {
          newErrors.confirmPassword = "Passwords do not match";
        } else {
          delete newErrors.confirmPassword;
        }
        break;

      default:
        break;
    }

    setErrors(newErrors);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (touched[name]) {
      validateField(name, value);
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    // Validate all fields
    Object.keys(profileData).forEach((key) => {
      validateField(key, profileData[key]);
    });

    // Check if form is valid
    const hasErrors = Object.keys(errors).length > 0;
    if (hasErrors) {
      setLoading(false);
      return;
    }

    try {
      const token = sessionStorage.getItem("auth_token");
      const updateData = {
        username: profileData.username,
        email: profileData.email,
        contact_number: profileData.contact_number,
      };

      // Add password fields if user is changing password
      if (profileData.newPassword) {
        updateData.currentPassword = profileData.currentPassword;
        updateData.newPassword = profileData.newPassword;
      }

      await api("/api/auth/update-profile", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      setMessage("Profile updated successfully!");
      setTimeout(() => {
        handleClose();
        window.location.reload();
      }, 2000);
    } catch (err) {
      console.error("Failed to update profile:", err);
      setError(err.message || "Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setProfileData({
      username: userData?.username || "",
      email: userData?.email || "",
      contact_number: userData?.contact_number || "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setErrors({});
    setTouched({});
    setMessage("");
    setError("");
    setActiveTab("account");
    onClose();
  };

  if (!isOpen) return null;

  const isFormValid =
    Object.keys(errors).length === 0 &&
    profileData.username.trim() &&
    profileData.email.trim();

  const footerContent = (
    <>
      <Button
        label="Cancel"
        variant="secondary"
        onClick={handleClose}
        type="button"
        disabled={loading}
        className="px-6 py-2.5 rounded-xl font-medium transition-all duration-200"
      />
      <Button
        label={loading ? "Saving..." : "Save Changes"}
        variant="primary"
        type="submit"
        onClick={handleSubmit}
        disabled={!isFormValid || loading}
        className="px-6 py-2.5 rounded-xl font-medium transition-all duration-200 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl"
      />
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Edit Profile"
      subtitle="Update your account details"
      icon={
        <svg
          className="w-5 h-5 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      }
      footer={footerContent}
      disabled={loading}
      contentClassName="space-y-5"
    >
      {/* Success Message */}
      {message && (
        <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/50 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top duration-300">
          <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
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
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-900">{message}</p>
            <p className="text-xs text-emerald-700 mt-0.5">
              Your profile has been updated successfully
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200/50 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top duration-300">
          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
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
          <div>
            <p className="text-sm font-semibold text-red-900">{error}</p>
            <p className="text-xs text-red-700 mt-0.5">
              Please check your information and try again
            </p>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border-slate-200/10 -mx-6 px-6">
        <button
          onClick={() => setActiveTab("account")}
          className={`px-4 py-2 rounded-t-xl font-medium transition-all duration-200 relative ${
            activeTab === "account"
              ? "text-blue-600 bg-blue-50/30"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <span className="flex items-center gap-2">
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
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            Account
          </span>
          {activeTab === "account" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"></div>
          )}
        </button>
        <button
          onClick={() => setActiveTab("security")}
          className={`px-4 py-2 rounded-t-xl font-medium transition-all duration-200 relative ${
            activeTab === "security"
              ? "text-blue-600 bg-blue-50/30"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <span className="flex items-center gap-2">
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
            Security
          </span>
          {activeTab === "security" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"></div>
          )}
        </button>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit}>
        {/* Account Tab */}
        {activeTab === "account" && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-sm font-bold text-slate-900">
                Personal Information
              </h3>
              <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent"></div>
            </div>

            {/* Username Field */}
            <FormField
              label="Username"
              name="username"
              value={profileData.username}
              onChange={handleInputChange}
              onBlur={handleBlur}
              placeholder="Enter username"
              error={
                touched.username && errors.username ? errors.username : null
              }
              required
            />

            {/* Email Field */}
            <FormField
              label="Email Address"
              name="email"
              type="email"
              value={profileData.email}
              onChange={handleInputChange}
              onBlur={handleBlur}
              placeholder="Enter email address"
              error={touched.email && errors.email ? errors.email : null}
              required
            />

            {/* Contact Number Field */}
            <FormField
              label="Contact Number"
              name="contact_number"
              type="tel"
              value={profileData.contact_number}
              onChange={handleInputChange}
              onBlur={handleBlur}
              placeholder="Enter phone number"
              error={
                touched.contact_number && errors.contact_number
                  ? errors.contact_number
                  : null
              }
            />
          </div>
        )}

        {/* Security Tab */}
        {activeTab === "security" && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-sm font-bold text-slate-900">
                Change Password
              </h3>
              <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent"></div>
            </div>
            <p className="text-xs text-slate-500 bg-amber-50 border border-amber-100/50 rounded-xl px-3 py-2">
              Leave blank to keep your current password
            </p>

            {/* Current Password Field */}
            <FormField
              label="Current Password"
              name="currentPassword"
              type="password"
              value={profileData.currentPassword}
              onChange={handleInputChange}
              onBlur={handleBlur}
              placeholder="Enter current password"
              error={
                touched.currentPassword && errors.currentPassword
                  ? errors.currentPassword
                  : null
              }
            />

            {/* Password Strength Indicator */}
            {profileData.newPassword && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-700">
                  Password Strength
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      profileData.newPassword.length >= 12
                        ? "w-full bg-gradient-to-r from-green-500 to-emerald-500"
                        : profileData.newPassword.length >= 8
                        ? "w-2/3 bg-gradient-to-r from-yellow-500 to-amber-500"
                        : "w-1/3 bg-gradient-to-r from-red-500 to-orange-500"
                    }`}
                  ></div>
                </div>
              </div>
            )}

            {/* New Password Field */}
            <FormField
              label="New Password"
              name="newPassword"
              type="password"
              value={profileData.newPassword}
              onChange={handleInputChange}
              onBlur={handleBlur}
              placeholder="Min. 6 characters"
              error={
                touched.newPassword && errors.newPassword
                  ? errors.newPassword
                  : null
              }
            />

            {/* Confirm Password Field */}
            <FormField
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              value={profileData.confirmPassword}
              onChange={handleInputChange}
              onBlur={handleBlur}
              placeholder="Re-enter new password"
              error={
                touched.confirmPassword && errors.confirmPassword
                  ? errors.confirmPassword
                  : null
              }
            />
          </div>
        )}
      </form>
    </BaseModal>
  );
};

export default ProfileModal;
