import React, { useState } from 'react';
import Input from './Input';

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
  ...props 
}) {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  // Eye icons for show/hide password
  const eyeIcon = showPassword ? (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 hover:text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.403-3.22 1.125-4.575m2.122-2.122A9.956 9.956 0 0112 3c5.523 0 10 4.477 10 10 0 1.657-.403 3.22-1.125 4.575m-2.122 2.122A9.956 9.956 0 0112 21c-2.21 0-4.267-.72-5.947-1.947m0 0L3 21m0 0l3-3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 hover:text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );

  return (
    <Input
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      type={showPassword ? "text" : "password"}
      error={error}
      autoComplete={autoComplete}
      className={className}
      suffix={
        <button
          type="button"
          onClick={togglePasswordVisibility}
          className="p-1 bg-transparent border-none shadow-none hover:bg-purple-100 rounded-full transition-colors"
          aria-label={showPassword ? "Hide password" : "Show password"}
          tabIndex={-1}
        >
          {eyeIcon}
        </button>
      }
      {...props}
    />
  );
} 