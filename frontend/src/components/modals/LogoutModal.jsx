import React from "react";
import Button from "../common/Button";
import BaseModal from "./BaseModal";

const LogoutModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Logout",
  message = "Are you sure you want to logout?",
  confirmText = "Logout",
  cancelText = "Cancel",
}) => {
  const footerContent = (
    <>
      <Button
        label={cancelText}
        variant="secondary"
        onClick={onClose}
        type="button"
      />
      <Button
        label={confirmText}
        variant="primary"
        onClick={onConfirm}
        type="button"
        className="bg-red-600 hover:bg-red-700"
      />
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
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
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          />
        </svg>
      }
      footer={footerContent}
      size="sm"
      contentClassName="text-center py-2"
    >
      <p className="text-gray-600 text-base">{message}</p>
    </BaseModal>
  );
};

export default LogoutModal;
