import React from 'react';

/**
 * Card Component
 * A versatile container component with multiple styling variants
 */
function Card({ 
  children, 
  className = '', 
  variant = 'shadow',
  padding = 'default'
}) {
  // Base styles
  const baseStyles = "bg-white rounded-2xl transition-all duration-200";
  
  // Variant styles
  const variantStyles = {
    shadow: 'shadow-xl hover:shadow-2xl',
    bordered: 'border-2 border-gray-200 hover:border-blue-200',
    flat: '',
    glass: 'bg-white/80 backdrop-blur-sm border border-white/20',
    gradient: 'bg-gradient-to-br from-white via-blue-50 to-blue-100 border border-blue-200'
  };
  
  // Padding variants
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    default: 'p-6 md:p-8',
    lg: 'p-8 md:p-12'
  };
  
  // Combine all styles
  const combinedStyles = `${baseStyles} ${variantStyles[variant]} ${paddingStyles[padding]} ${className}`;
  
  return (
    <div className={combinedStyles}>
      {children}
    </div>
  );
}

export default Card; 