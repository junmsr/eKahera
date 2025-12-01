import React, { useState } from "react";
import Button from "../common/Button";
import FormField from "../common/FormField";
import BaseModal from "./BaseModal";

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Deletion",
  message = "Are you sure you want to delete this item? This action cannot be undone.",
  isLoading = false,
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    if (!password) {
      setError("Password is required.");
      return;
    }
    setError("");
    try {
      await onConfirm(password);
      handleClose();
    } catch (err) {
      setError(err.message || "An error occurred.");
    }
  };

  const handleClose = () => {
    setPassword("");
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  const footerContent = (
    <>
      <Button
        label="Cancel"
        variant="secondary"
        onClick={handleClose}
        type="button"
        disabled={isLoading}
      />
      <Button
        label="Delete"
        variant="danger"
        type="button"
        onClick={handleConfirm}
        disabled={!password || isLoading}
        isLoading={isLoading}
      />
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      subtitle="Please enter your password to confirm."
      icon={
        <svg
          className="w-6 h-6 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          ></path>
        </svg>
      }
      footer={footerContent}
      disabled={isLoading}
      size="md"
      contentClassName="space-y-4"
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600">{message}</p>
        <FormField
          label="Admin Password"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          error={error}
          required
        />
      </div>
    </BaseModal>
  );
}
