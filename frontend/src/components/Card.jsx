import React from 'react';

function Card({ children, className = '', variant = 'shadow' }) {
  const variants = {
    shadow: 'bg-white rounded-2xl shadow-xl p-6 md:p-8',
    bordered: 'bg-white rounded-2xl border border-gray-200 p-6 md:p-8',
    flat: 'bg-white rounded-2xl p-6 md:p-8'
  };
  return (
    <div className={`${variants[variant]} ${className}`}>
      {children}
    </div>
  );
}

export default Card; 