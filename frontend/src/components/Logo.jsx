import React from 'react';

/**
 * Logo Component
 * Displays the eKahera logo with customizable size and styling
 */
function Logo({ 
  size = 48, 
  className = '',
  variant = 'default'
}) {
  // Base styles
  const baseStyles = "bg-white rounded-full flex items-center justify-center shadow-md transition-all duration-200";
  
  // Variant styles
  const variantStyles = {
    default: "shadow-md hover:shadow-lg",
    flat: "shadow-none",
    gradient: "bg-gradient-to-br from-purple-500 to-purple-700 shadow-lg"
  };
  
  // Text color based on variant
  const textColor = variant === 'gradient' ? 'text-white' : 'text-purple-600';
  
  // Combine styles
  const combinedStyles = `${baseStyles} ${variantStyles[variant]} ${className}`;
  
  return (
    <div
      className={combinedStyles}
      style={{ width: size, height: size }}
      role="img"
      aria-label="eKahera Logo"
    >
      <span 
        className={`font-bold ${textColor}`} 
        style={{ fontSize: size * 0.4 }}
      >
        eK
      </span>
    </div>
  );
}

export default Logo; 