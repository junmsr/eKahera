import React from 'react';

/**
 * Button Component
 * A reusable button component with multiple variants and states
 */
function Button({ 
  label, 
  children, 
  onClick, 
  type = 'button', 
  className = '', 
  variant = 'primary', 
  disabled = false,
  size = 'md'
}) {
  // Base styles
  const baseStyles = "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2";
  
  // Size variants
  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg"
  };
  
  // Color variants
  const variantStyles = {
    primary: "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg",
    secondary: "bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-300",
    outline: "border-2 border-blue-600 text-blue-600 bg-white hover:bg-blue-50 hover:border-blue-700",
    ghost: "text-blue-600 hover:bg-blue-50"
  };
  
  // Disabled state
  const disabledStyles = disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : "";
  
  // Combine all styles
  const combinedStyles = `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${disabledStyles} ${className}`;
  
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