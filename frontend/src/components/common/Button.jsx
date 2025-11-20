import React from "react";

/**
 * Button Component
 * 2025: Glassy/soft backgrounds, animated shadow, microinteractions, bold typography
 * Enhanced to support icon buttons, close buttons, and password toggle buttons
 */
function Button({
  label,
  children,
  onClick,
  type = "button",
  className = "",
  variant = "primary",
  disabled = false,
  size = "md",
  microinteraction = true,
  icon,
  iconPosition = "left",
  isIconButton = false,
  isCloseButton = false,
  isPasswordToggle = false,
  showPassword = false,
  ...props
}) {
  // Base styles
  const baseStyles =
    "inline-flex items-center justify-center font-sans font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 select-none";

  // Size variants
  const sizeStyles = {
    sm: isIconButton ? "p-2 text-sm" : "px-4 py-2 text-sm",
    md: isIconButton ? "p-2.5 text-base" : "px-6 py-2.5 text-base",
    lg: isIconButton ? "p-3 text-lg" : "px-8 py-3 text-lg",
  };

  // Color variants
  const variantStyles = {
    primary:
      "bg-blue-600 text-white shadow-md hover:from-blue-600 hover:to-blue-800 hover:shadow-lg",
    secondary:
      "bg-white text-blue-700 border border-blue-200 shadow-sm hover:bg-blue-50 hover:text-blue-900",
    outline:
      "border-2 border-blue-600 text-blue-600 bg-white hover:bg-blue-50 hover:border-blue-700",
    ghost: "text-blue-600 hover:bg-blue-50",
    danger:
      "bg-gradient-to-r from-red-500 to-red-700 text-white shadow-md hover:from-red-600 hover:to-red-800 hover:shadow-lg",
    success:
      "bg-gradient-to-r from-green-500 to-green-700 text-white shadow-md hover:from-green-600 hover:to-green-800 hover:shadow-lg",
    warning:
      "bg-gradient-to-r from-yellow-500 to-yellow-700 text-white shadow-md hover:from-yellow-600 hover:to-yellow-800 hover:shadow-lg",
    // Special variants for specific use cases
    close:
      "absolute top-3 right-3 text-blue-400 hover:text-blue-700 text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-full transition-colors duration-150",
    passwordToggle:
      "p-1 bg-transparent border-none shadow-none hover:bg-blue-100 rounded-full transition-colors focus:ring-0 focus:ring-transparent focus:ring-offset-0",
    iconAction:
      "rounded-full p-1 hover:bg-opacity-80 transition flex items-center",
    stockEntry:
      "bg-green-100 border border-green-300 rounded-full p-1 hover:bg-green-200 transition flex items-center",
    edit: "bg-blue-100 border border-blue-300 rounded-full p-1 hover:bg-blue-200 transition flex items-center",
    delete:
      "bg-red-100 border border-red-300 rounded-full p-1 hover:bg-red-200 transition flex items-center",
    pagination: "px-3 py-1 rounded-lg font-semibold border",
    paginationActive:
      "px-3 py-1 rounded-lg font-semibold border bg-blue-500 text-white border-blue-500",
    paginationInactive:
      "px-3 py-1 rounded-lg font-semibold border bg-white text-blue-700 border-blue-200 hover:bg-blue-100",
  };

  // Disabled state
  const disabledStyles = disabled
    ? "opacity-50 cursor-not-allowed pointer-events-none"
    : "";

  // Microinteraction (scale/glow on hover/focus)
  const microClass =
    microinteraction && !isCloseButton && !isPasswordToggle
      ? "hover:scale-[1.03] active:scale-[0.97] transition-transform focus:shadow-blue-300/40"
      : "";

  // Determine which variant to use
  let finalVariant = variant;
  if (isCloseButton) finalVariant = "close";
  if (isPasswordToggle) finalVariant = "passwordToggle";

  // Combine all styles
  const combinedStyles = `${baseStyles} ${sizeStyles[size]} ${variantStyles[finalVariant]} ${disabledStyles} ${microClass} ${className}`;

  // Password toggle icon
  const passwordToggleIcon = showPassword ? (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5 text-gray-500 hover:text-blue-600"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.403-3.22 1.125-4.575m2.122-2.122A9.956 9.956 0 0112 3c5.523 0 10 4.477 10 10 0 1.657-.403 3.22-1.125 4.575m-2.122 2.122A9.956 9.956 0 0112 21c-2.21 0-4.267-.72-5.947-1.947m0 0L3 21m0 0l3-3"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  ) : (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5 text-gray-500 hover:text-blue-600"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
  );

  // Close button content
  const closeButtonContent = isCloseButton ? "&times;" : null;

  // Password toggle content
  const passwordToggleContent = isPasswordToggle ? passwordToggleIcon : null;

  // Regular content
  const regularContent = (
    <>
      {icon && iconPosition === "left" && icon}
      {children || label}
      {icon && iconPosition === "right" && icon}
    </>
  );

  return (
    <button
      type={type}
      onClick={onClick}
      className={combinedStyles}
      disabled={disabled}
      {...props}
    >
      {closeButtonContent || passwordToggleContent || regularContent}
    </button>
  );
}

// CashierButton: White, blue border, blue text
export function CashierButton({ onClick, ...props }) {
  return (
    <Button
      onClick={onClick}
      className="bg-white text-blue-600 font-semibold rounded-xl py-3 px-10 text-lg shadow-md border border-blue-100 hover:bg-blue-50 transition-colors min-w-[160px]"
      aria-label="Go to Customer Portal"
      {...props}
    >
      Cashier
    </Button>
  );
}

// AdminButton: Blue background, white text
export function AdminButton({ onClick, ...props }) {
  return (
    <Button
      onClick={onClick}
      className="bg-blue-600 text-white font-semibold rounded-xl py-3 px-10 text-lg shadow-md hover:bg-blue-700 transition-colors min-w-[160px]"
      aria-label="Go to Cashier/Admin Portal"
      {...props}
    >
      Admin
    </Button>
  );
}

export default Button;
