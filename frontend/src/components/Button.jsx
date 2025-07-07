import React from 'react';

/**
 * Button Component
 * 2025: Glassy/soft backgrounds, animated shadow, microinteractions, bold typography
 */
function Button({ 
  label, 
  children, 
  onClick, 
  type = 'button', 
  className = '', 
  variant = 'primary', 
  disabled = false,
  size = 'md',
  microinteraction = true
}) {
  // Base styles
  const baseStyles = "inline-flex items-center justify-center font-sans font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 select-none";
  // Size variants
  const sizeStyles = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-2.5 text-base",
    lg: "px-8 py-3 text-lg"
  };
  // Color variants
  const variantStyles = {
    primary: "bg-gradient-to-r from-blue-500 to-blue-700 text-white shadow-md hover:from-blue-600 hover:to-blue-800 hover:shadow-lg",
    secondary: "bg-white text-blue-700 border border-blue-200 shadow-sm hover:bg-blue-50 hover:text-blue-900",
    outline: "border-2 border-blue-600 text-blue-600 bg-white hover:bg-blue-50 hover:border-blue-700",
    ghost: "text-blue-600 hover:bg-blue-50"
  };
  // Disabled state
  const disabledStyles = disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : "";
  // Microinteraction (scale/glow on hover/focus)
  const microClass = microinteraction ? 'hover:scale-[1.03] active:scale-[0.97] transition-transform focus:shadow-blue-300/40' : '';
  // Combine all styles
  const combinedStyles = `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${disabledStyles} ${microClass} ${className}`;
  return (
    <button
      type={type}
      onClick={onClick}
      className={combinedStyles}
      disabled={disabled}
    >
      {children || label}
    </button>
  );
}

export default Button;