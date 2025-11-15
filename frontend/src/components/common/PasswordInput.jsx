import React, { useState } from 'react';

/**
 * PasswordInput Component
 * A password input field with show/hide functionality
 */
export default function PasswordInput({ 
  name, 
  value, 
  onChange, 
  placeholder = "Password", 
  error, 
  autoComplete = "current-password",
  className = "",
  variant = "glass",
  size = "md",
  microinteraction = true,
  ...props 
}) {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  // Base styles — use dark gray for normal text and gray for placeholder
  const baseStyles =
    "w-full rounded-xl text-base text-gray-900 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-blue-400 placeholder:text-gray-400 bg-white/60 backdrop-blur-md border border-white/30 shadow-sm";
  
  // Size variants
  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-4 py-3 text-lg",
  };
  
  // Variant styles
  const variantStyles = {
    glass: error
      ? "border-red-400 ring-red-200"
      : "border-white/30 hover:border-blue-300",
    bordered: error
      ? "border-red-400 ring-red-200"
      : "border-2 border-blue-400",
    underline: error
      ? "border-red-400 ring-red-200"
      : "border-b-2 border-blue-400 rounded-none",
    default: error
      ? "border-red-400 ring-red-200"
      : "border-gray-300 hover:border-blue-300",
  };
  
  // Microinteraction (scale on focus)
  const microClass = microinteraction
  
  // Combine all styles with padding for the toggle button
  const combinedStyles = `${baseStyles} ${sizeStyles[size]} ${
    variantStyles[variant]
  } pr-12 ${microClass} ${className}`;

  return (
    <div className="relative">
      <input
        type={showPassword ? "text" : "password"}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={combinedStyles}
        autoComplete={autoComplete}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
        {...props}
      />
      
      {/* Password Toggle Button */}
      <button
        type="button"
        onClick={togglePasswordVisibility}
        className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200 focus:outline-none focus:text-blue-500"
        aria-label={showPassword ? "Hide password" : "Show password"}
        tabIndex={0}
      >
        {showPassword ? (
          // Eye slash icon (hide password)
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
          </svg>
        ) : (
          // Eye icon (show password)
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        )}
      </button>
      
      {/* Error message */}
      {error && (
        <p
          id={`${name}-error`}
          className="text-red-500 text-xs mt-1 font-medium"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
} 