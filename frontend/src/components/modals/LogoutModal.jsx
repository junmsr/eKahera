import React from "react";

// Styling constants for the logout modal
const MODAL_STYLES = {
  overlay: "fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm",
  content: "bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl border border-gray-200",
  title: "text-lg font-semibold text-gray-900 mb-4",
  text: "text-gray-600 mb-6",
  buttons: "flex gap-3 justify-end",
  button: "px-4 py-2 rounded-lg font-medium transition-colors duration-200",
  buttonCancel: "bg-gray-200 text-gray-800 hover:bg-gray-300",
  buttonConfirm: "bg-red-600 text-white hover:bg-red-700",
};

/**
 * Logout Confirmation Modal Component
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function to call when modal is closed
 * @param {Function} props.onConfirm - Function to call when logout is confirmed
 * @param {string} props.title - Modal title (optional)
 * @param {string} props.message - Modal message (optional)
 * @param {string} props.confirmText - Confirm button text (optional)
 * @param {string} props.cancelText - Cancel button text (optional)
 * 
 * @returns {JSX.Element|null} The logout confirmation modal or null if not open
 */
const LogoutModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirm Logout",
  message = "Are you sure you want to logout? You will be redirected to the home page.",
  confirmText = "Logout",
  cancelText = "Cancel"
}) => {
  if (!isOpen) return null;

  return (
    <div className={MODAL_STYLES.overlay}>
      <div className={MODAL_STYLES.content}>
        <h3 className={MODAL_STYLES.title}>{title}</h3>
        <p className={MODAL_STYLES.text}>{message}</p>
        <div className={MODAL_STYLES.buttons}>
          <button
            onClick={onClose}
            className={`${MODAL_STYLES.button} ${MODAL_STYLES.buttonCancel}`}
            type="button"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`${MODAL_STYLES.button} ${MODAL_STYLES.buttonConfirm}`}
            type="button"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;
