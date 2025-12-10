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
  const [deleteState, setDeleteState] = useState({ status: "none" });
  const [deleteMessage, setDeleteMessage] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setMessage("");
    setError("");
    setDeleteError("");
    setDeleteMessage("");
    setConfirmText("");
    fetchDeletionStatus();
  }, [isOpen]);

  if (!isOpen) return null;

  const fetchDeletionStatus = async () => {
    try {
      setDeleteLoading(true);
      const res = await api("/api/business/delete-request");
      setDeleteState(res?.deletion || { status: "none" });
      setDeleteMessage(res?.message || "");
    } catch (e) {
      setDeleteError(
        e?.message || "Could not load deletion status. Please try again."
      );
    } finally {
      setDeleteLoading(false);
    }
  };

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

  const handleRequestDeletion = async () => {
    setDeleteError("");
    setDeleteMessage("");
    if (confirmText.trim().toLowerCase() !== "delete") {
      setDeleteError('Type "DELETE" to confirm.');
      return;
    }
    setDeleteLoading(true);
    try {
      const res = await api("/api/business/delete-request", { method: "POST" });
      setDeleteState(res?.deletion || { status: "pending" });
      setDeleteMessage(
        res?.message || "Deletion request recorded with a 30-day grace period."
      );
    } catch (e) {
      setDeleteError(
        e?.message || "Could not request deletion. Please try again."
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
      setDeleteState(res?.deletion || { status: "none" });
      setDeleteMessage(res?.message || "Deletion request cancelled.");
      setConfirmText("");
    } catch (e) {
      setDeleteError(
        e?.message || "Could not cancel deletion. Please try again."
      );
    } finally {
      setDeleteLoading(false);
    }
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

  const formatDate = (val) => {
    if (!val) return "-";
    try {
      return new Date(val).toLocaleString();
    } catch {
      return val;
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

        <div className="mt-6 border-t pt-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Delete {storeLabel}
              </p>
              <p className="text-xs text-gray-600">
                Download all transactions then schedule deletion with a 30-day
                recovery window.
              </p>
            </div>
            {deleteLoading && (
              <span className="text-xs text-blue-600">Working…</span>
            )}
          </div>

          {deleteMessage && (
            <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 mb-3">
              {deleteMessage}
            </div>
          )}
          {deleteError && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
              {deleteError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-700 mb-3">
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
              {formatDate(deleteState.exportReadyAt)}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-800">
              Type "DELETE" to confirm
            </label>
            <input
              type="text"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder='DELETE'
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              label={downloadLoading ? "Preparing..." : "Download transactions"}
              variant="secondary"
              onClick={handleDownloadExport}
              disabled={downloadLoading}
            />
            <Button
              label={deleteLoading ? "Scheduling..." : "Schedule deletion"}
              variant="danger"
              onClick={handleRequestDeletion}
              disabled={deleteLoading}
            />
            {deleteState.status === "pending" && (
              <Button
                label="Cancel deletion"
                variant="secondary"
                onClick={handleCancelDeletion}
                disabled={deleteLoading}
              />
            )}
          </div>
          <p className="text-[11px] text-gray-500 mt-2">
            You can recover the account within 30 days. After that, the store is
            permanently removed.
          </p>
        </div>
      </div>
    </BaseModal>
  );
};

export default ProfileModal;
