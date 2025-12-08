import React from "react";
import { MdClose } from "react-icons/md";

/**
 * BaseModal Component
 * Unified modal structure for consistency across the application
 * Provides: backdrop, header with icon, scrollable content, sticky footer, animations
 */
export default function BaseModal({
  isOpen = false,
  onClose,
  title,
  subtitle,
  icon,
  children,
  size = "md",
  showHeader = true,
  showCloseButton = true,
  footer,
  className = "",
  contentClassName = "",
  headerIcon,
  headerIconBgClassName = "bg-gradient-to-br from-blue-500 to-indigo-600",
  disabled = false,
}) {
  if (!isOpen) return null;

  // Size mapping
  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-xl",
    lg: "max-w-3xl",
    full: "max-w-5xl",
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      ></div>

      {/* Modal */}
      <div
        className={`relative bg-white rounded-lg shadow-2xl w-full ${sizeClasses[size]} max-h-[85vh] overflow-hidden flex flex-col z-[10000] ${className}`}
      >
        {/* Gradient Background Accents */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-indigo-600/10 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-gradient-to-tr from-purple-400/10 to-pink-600/10 rounded-full blur-3xl -z-10"></div>

        {/* Header */}
        {showHeader && (
          <div className="sticky top-0 px-6 py-5 bg-gradient-to-r from-white via-slate-50 to-white backdrop-blur-xl border-b border-slate-200/20 flex items-center justify-between z-50 flex-shrink-0">
            <div className="flex items-center gap-3 flex-1">
              {(icon || headerIcon) && (
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 ${headerIconBgClassName}`}
                >
                  {icon || headerIcon}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-bold text-gray-900 truncate">
                  {title}
                </h2>
                {subtitle && (
                  <p className="text-xs text-gray-500 truncate">{subtitle}</p>
                )}
              </div>
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200 p-2 rounded-xl ml-2 flex-shrink-0"
                type="button"
                disabled={disabled}
                aria-label="Close modal"
              >
                <MdClose className="w-6 h-6" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className={`overflow-y-auto flex-1 px-6 py-6 ${contentClassName}`}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="sticky bottom-0 px-6 py-4 bg-gradient-to-t from-slate-50 via-white to-transparent border-t border-slate-200/10 flex justify-end gap-3 backdrop-blur-sm flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
