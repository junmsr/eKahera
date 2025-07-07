import React from 'react';

/**
 * Card Component
 * 2025: Glassmorphism, soft shadow, animated hover/focus, professional look
 */
function Card({ 
  children, 
  className = '', 
  variant = 'glass',
  padding = 'default',
  microinteraction = false
}) {
  // Base styles
  const baseStyles = "rounded-3xl transition-all duration-300 backdrop-blur-xl bg-white/60 border border-white/30 shadow-xl hover:shadow-2xl focus-within:shadow-2xl";
  // Variant styles
  const variantStyles = {
    glass: 'bg-white/60 backdrop-blur-xl border border-white/30',
    shadow: 'bg-white shadow-xl hover:shadow-2xl',
    bordered: 'border-2 border-gray-200 hover:border-blue-200',
    flat: '',
    gradient: 'bg-gradient-to-br from-white via-blue-50 to-blue-100 border border-blue-200'
  };
  // Padding variants
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    default: 'p-6 md:p-8',
    lg: 'p-8 md:p-12'
  };
  // Microinteraction (pulse on hover/focus)
  const microClass = microinteraction ? 'hover:scale-[1.015] active:scale-[0.98] transition-transform' : '';
  // Combine all styles
  const combinedStyles = `${baseStyles} ${variantStyles[variant]} ${paddingStyles[padding]} ${microClass} ${className}`;
  return (
    <div className={combinedStyles} tabIndex={0}>
      {children}
    </div>
  );
}

export default Card; 