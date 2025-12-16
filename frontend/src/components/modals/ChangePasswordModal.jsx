import React, { useState, useMemo } from "react";
import Button from "../common/Button";
import FormField from "../common/FormField";
import PasswordInput from "../common/PasswordInput";
import BaseModal from "./BaseModal";
import { api } from "../../lib/api";

const ChangePasswordModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  // Password requirements validation
  const passwordRequirements = useMemo(() => {
    const password = formData.newPassword;
    return {
      minLength: password.length >= 12,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
  }, [formData.newPassword]);
  
  const isPasswordValid = useMemo(() => {
    return Object.values(passwordRequirements).every(req => req === true);
  }, [passwordRequirements]);
  
  const isFormValid = useMemo(() => {
    return (
      formData.currentPassword.trim() !== "" &&
      isPasswordValid &&
      formData.newPassword === formData.confirmPassword &&
      formData.confirmPassword.trim() !== ""
    );
  }, [formData, isPasswordValid]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.currentPassword) {
      newErrors.currentPassword = "Current password is required";
    }
    
    if (!formData.newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (!isPasswordValid) {
      newErrors.newPassword = "Password does not meet requirements";
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your new password";
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError("");
    setMessage("");
    
    try {
      const response = await api("/auth/password", {
        method: "PUT",
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });
      
      if (response?.message) {
        setMessage(response.message || "Password updated successfully");
        setFormData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        // Auto-close after a short delay
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err) {
      console.error("Error updating password:", err);
      // The api function throws errors - check multiple sources for error message
      let errorMessage = "Failed to update password";
      
      // Try to get specific error from response data
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.data?.error) {
        errorMessage = err.data.error;
      } else if (err.message) {
        // For 400 errors, the api function may return generic messages
        // Check if it's a generic one and provide more context
        if (err.message.includes("Invalid request")) {
          errorMessage = "Please check your current password and try again";
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Change Password"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
            {error}
          </div>
        )}
        
        {message && (
          <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm">
            {message}
          </div>
        )}
        
        {/* Current Password */}
        <div className="mb-5">
          <label className="block mb-1 font-medium text-blue-800">
            Current Password
            <span className="text-red-500 ml-1">*</span>
          </label>
          <PasswordInput
            name="currentPassword"
            value={formData.currentPassword}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.currentPassword && errors.currentPassword}
            disabled={loading}
            autoComplete="current-password"
            placeholder="Enter your current password"
          />
        </div>
        
        {/* New Password */}
        <div className="mb-5">
          <label className="block mb-1 font-medium text-blue-800">
            New Password
            <span className="text-red-500 ml-1">*</span>
          </label>
          <PasswordInput
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.newPassword && errors.newPassword}
            disabled={loading}
            autoComplete="new-password"
            placeholder="Enter your new password"
          />
          
          {/* Password Requirements */}
          {formData.newPassword && (
            <div className="mt-2 p-3 bg-gray-50 rounded-md border border-gray-200">
              <p className="text-xs font-medium text-gray-700 mb-2">Password Requirements:</p>
              <ul className="space-y-1 text-xs">
                <li className={`flex items-center ${passwordRequirements.minLength ? 'text-green-600' : 'text-gray-500'}`}>
                  <span className={`mr-2 ${passwordRequirements.minLength ? 'text-green-500' : 'text-gray-400'}`}>
                    {passwordRequirements.minLength ? '✓' : '○'}
                  </span>
                  At least 12 characters
                </li>
                <li className={`flex items-center ${passwordRequirements.hasUpperCase ? 'text-green-600' : 'text-gray-500'}`}>
                  <span className={`mr-2 ${passwordRequirements.hasUpperCase ? 'text-green-500' : 'text-gray-400'}`}>
                    {passwordRequirements.hasUpperCase ? '✓' : '○'}
                  </span>
                  One uppercase letter
                </li>
                <li className={`flex items-center ${passwordRequirements.hasLowerCase ? 'text-green-600' : 'text-gray-500'}`}>
                  <span className={`mr-2 ${passwordRequirements.hasLowerCase ? 'text-green-500' : 'text-gray-400'}`}>
                    {passwordRequirements.hasLowerCase ? '✓' : '○'}
                  </span>
                  One lowercase letter
                </li>
                <li className={`flex items-center ${passwordRequirements.hasNumber ? 'text-green-600' : 'text-gray-500'}`}>
                  <span className={`mr-2 ${passwordRequirements.hasNumber ? 'text-green-500' : 'text-gray-400'}`}>
                    {passwordRequirements.hasNumber ? '✓' : '○'}
                  </span>
                  One number
                </li>
                <li className={`flex items-center ${passwordRequirements.hasSpecialChar ? 'text-green-600' : 'text-gray-500'}`}>
                  <span className={`mr-2 ${passwordRequirements.hasSpecialChar ? 'text-green-500' : 'text-gray-400'}`}>
                    {passwordRequirements.hasSpecialChar ? '✓' : '○'}
                  </span>
                  One special character (!@#$%^&*(),.?":{}|&lt;&gt;)
                </li>
              </ul>
            </div>
          )}
        </div>
        
        {/* Confirm New Password */}
        <div className="mb-5">
          <label className="block mb-1 font-medium text-blue-800">
            Confirm New Password
            <span className="text-red-500 ml-1">*</span>
          </label>
          <PasswordInput
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.confirmPassword && errors.confirmPassword}
            disabled={loading}
            autoComplete="new-password"
            placeholder="Confirm your new password"
          />
        </div>
        
        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={loading}
            disabled={loading || !isFormValid}
          >
            Update Password
          </Button>
        </div>
      </form>
    </BaseModal>
  );
};

export default ChangePasswordModal;
