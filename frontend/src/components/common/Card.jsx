import React from 'react';

/**
 * Base Card Component
 * 2025: Glassmorphism, soft shadow, animated hover/focus, professional look
 * Base component for all card variants
 */
function Card({ 
  children, 
  className = '', 
  variant = 'glass',
  padding = 'default',
  cardBg,
  ...props
}) {
  // Base styles
  const baseStyles = "rounded-lg transition-all duration-300 backdrop-blur-xl bg-white/60 border border-white/30 shadow-xl";
  
  // Variant styles
  const variantStyles = {
    glass: 'bg-white/60 backdrop-blur-xl border border-white/30',
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
  
  // Combine all styles
  const combinedStyles = `${baseStyles} ${variantStyles[variant]} ${paddingStyles[padding]} ${className}`;

  return (
    <div className={`${combinedStyles} ${cardBg || ''}`} tabIndex={0} {...props}>
      {children}
      <style>{`
        .emphasized-card {
          background: linear-gradient(135deg, rgba(255,255,255,0.7) 60%, rgba(59,130,246,0.10) 100%);
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.18), 0 1.5px 8px 0 rgba(59,130,246,0.10);
          border: 2.5px solid rgba(59,130,246,0.13);
          backdrop-filter: blur(18px) saturate(1.2);
          border-radius: 2rem;
          transition: box-shadow 0.25s, border 0.25s;
        }
        .emphasized-card:focus-within, .emphasized-card:hover {
          box-shadow: 0 12px 40px 0 rgba(59,130,246,0.22), 0 2px 12px 0 rgba(59,130,246,0.13);
          border-color: #3b82f6;
        }
      `}</style>
    </div>
  );
}

export default Card; 