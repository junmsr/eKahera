import React from 'react';

/**
 * Loader Component
 * A customizable loading spinner with multiple sizes and colors
 */
function Loader({ 
  className = '', 
  size = 'md', 
  variant = 'spinner',
  color = 'blue'
}) {
  // Size variants
  const sizeStyles = {
    xs: 'h-3 w-3 border',
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-4',
    lg: 'h-12 w-12 border-4',
    xl: 'h-16 w-16 border-4'
  };
  
  // Color variants
  const colorStyles = {
    blue: 'border-t-blue-500',
    white: 'border-t-white',
    gray: 'border-t-gray-500'
  };
  
  // Variant styles
  const variantStyles = {
    spinner: 'animate-spin rounded-full border-gray-200',
    dots: 'flex space-x-1',
    pulse: 'animate-pulse rounded-full bg-gray-200'
  };
  
  // Combine styles
  const combinedStyles = `${sizeStyles[size]} ${colorStyles[color]} ${variantStyles[variant]} ${className}`;
  
  // Render different variants
  if (variant === 'dots') {
    return (
      <div className={`flex items-center justify-center ${className}`} role="status" aria-label="Loading">
        <div className="flex space-x-1">
          <div className={`w-2 h-2 bg-${color}-500 rounded-full animate-bounce`}></div>
          <div className={`w-2 h-2 bg-${color}-500 rounded-full animate-bounce`} style={{ animationDelay: '0.1s' }}></div>
          <div className={`w-2 h-2 bg-${color}-500 rounded-full animate-bounce`} style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`flex items-center justify-center ${className}`} role="status" aria-label="Loading">
      <div className={combinedStyles}></div>
    </div>
  );
}

export default Loader;
