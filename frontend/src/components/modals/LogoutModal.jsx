import React from "react";

// Updated styling constants for the logout modal with higher z-index and proper positioning
const MODAL_STYLES = {
  overlay:
    "fixed inset-0 backdrop-blur-sm flex items-center justify-center z-[99999]",
  content:
    "bg-white/90 backdrop-blur-md rounded-lg p-8 max-w-md w-[90%] shadow-2xl border border-gray-200/50 z-[100000] transform scale-100 transition-transform duration-200",
  title: "text-2xl font-bold text-gray-900 mb-4",
  text: "text-gray-600 text-lg mb-8",
  buttons: "flex gap-4 justify-end",
  button:
    "px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-200",
  buttonCancel: "bg-gray-100 text-gray-800 hover:bg-gray-200 hover:shadow-md",
  buttonConfirm: "bg-red-600 text-white hover:bg-blue-700 hover:shadow-md",
};

const LogoutModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Logout",
  message = "Are you sure you want to logout?",
  confirmText = "Logout",
  cancelText = "Cancel",
}) => {
  if (!isOpen) return null;

  return (
    <>
      <div className={MODAL_STYLES.overlay} onClick={onClose}>
        <div
          className={MODAL_STYLES.content}
          onClick={(e) => e.stopPropagation()}
        >
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
    </>
  );
};

export default LogoutModal;
