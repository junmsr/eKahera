import React, { useState, useEffect } from "react";
import Button from "../common/Button";
import BaseModal from "./BaseModal";
import { api } from "../../lib/api";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";

const ProfileModal = ({ isOpen, onClose, userData }) => {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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

  useEffect(() => {
    if (!isOpen) return;
    setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setMessage("");
    setError("");
  }, [isOpen]);

  useKeyboardShortcuts(
    [
      {
        key: "escape",
        action: onClose,
        enabled: isOpen,
        allowWhileTyping: true,
      },
      {
        key: "enter",
        action: handleSubmit,
        enabled: isOpen,
        allowWhileTyping: true,
      },
    ],
    [isOpen, form]
  );

  if (!isOpen) return null;

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
      subtitle={
        <div className="flex flex-col gap-2">
          <p>Cashiers can only change their password here</p>
          <div className="mt-2 pt-2 border-t border-gray-200">
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <span className="inline-flex items-center justify-center bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-0.5 rounded">
                F11
              </span>
              <span>Recent Receipts</span>
            </p>
          </div>
        </div>
      }
      footer={
        <div className="w-full flex gap-2 justify-end">
          <Button
            label="Cancel"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          />
          <Button
            label={
              loading ? "Saving..." : "Save Password (Enter)"
            }
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
        <div className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 space-y-1">
          <div className="flex items-center justify-between">
            <span>Save password:</span>
            <span className="font-mono bg-white px-2 py-0.5 rounded">Enter</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Close:</span>
            <span className="font-mono bg-white px-2 py-0.5 rounded">Esc</span>
          </div>
        </div>
      </div>
    </BaseModal>
  );
};

export default ProfileModal;
