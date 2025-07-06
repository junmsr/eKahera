import React from 'react';

/**
 * Input Component
 * A flexible input component with multiple variants and error handling
 */
function Input({ 
  type = 'text', 
  name, 
  value, 
  onChange, 
  placeholder = '', 
  className = '', 
  error, 
  variant = 'default', 
  suffix,
  size = 'md',
  ...props 
}) {
  // Base styles
  const baseStyles = "w-full border rounded-lg text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-400 placeholder-gray-400";
  
  // Size variants
  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-4 py-3 text-lg"
  };
  
  // Variant styles
  const variantStyles = {
    default: error ? 'border-red-400 ring-red-200' : 'border-gray-300 hover:border-purple-300',
    bordered: error ? 'border-red-400 ring-red-200' : 'border-2 border-purple-400',
    underline: error ? 'border-red-400 ring-red-200' : 'border-b-2 border-purple-400 rounded-none'
  };
  
  // Combine all styles
  const combinedStyles = `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${suffix ? 'pr-10' : ''} ${className}`;
  
  return (
    <div className="relative">
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={combinedStyles}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
        {...props}
      />
      
      {/* Suffix (e.g., password toggle, icons) */}
      {suffix && (
        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
          {suffix}
        </div>
      )}
      
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

export default Input;
