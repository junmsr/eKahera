import React, { useState, useEffect } from "react";
import Button from "../common/Button";
import BaseModal from "./BaseModal";
import { api } from "../../lib/api";

const ProfileModal = ({ isOpen, onClose, userData }) => {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setMessage("");
    setError("");
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setError("");
    setMessage("");

    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      setError("Please fill in all password fields.");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }
    setLoading(true);
    try {
      const token = sessionStorage.getItem("auth_token");
      await api("/api/auth/password", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });
      setMessage("Password updated successfully.");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (e) {
      setError(
        e?.error ||
          e?.message ||
          "Failed to update password. Please check your current password."
      );
    } finally {
      setLoading(false);
    }
  };

  const storeLabel =
    userData?.store_name ||
    userData?.storeName ||
    userData?.businessName ||
    "your store";

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Update Password"
      subtitle="Cashiers can only change their password here"
      footer={
        <div className="w-full flex gap-2 justify-end">
          <Button
            label="Cancel"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          />
          <Button
            label={loading ? "Saving..." : "Save Password"}
            variant="primary"
            onClick={handleSubmit}
            disabled={loading}
          />
        </div>
      }
    >
      {message && (
        <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 mb-3">
          {message}
        </div>
      )}
      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
          {error}
        </div>
      )}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">
            Current Password
          </label>
          <input
            type="password"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={form.currentPassword}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, currentPassword: e.target.value }))
            }
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">
            New Password
          </label>
          <input
            type="password"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={form.newPassword}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, newPassword: e.target.value }))
            }
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">
            Confirm New Password
          </label>
          <input
            type="password"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={form.confirmPassword}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
            }
          />
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-800">
          Password must be at least 12 characters and include upper, lower,
          number, and special characters.
        </div>
      </div>
    </BaseModal>
  );
};

export default ProfileModal;
