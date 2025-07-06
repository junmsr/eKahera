import React from 'react';

function Loader({ className = '', size = 'md', color = 'border-t-purple-500' }) {
  const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-4',
    lg: 'h-12 w-12 border-4',
  };
  return (
    <div className={`flex items-center justify-center ${className}`} role="status" aria-label="Loading">
      <div className={`animate-spin rounded-full border-gray-200 ${color} ${sizes[size]}`}></div>
    </div>
  );
}

export default Loader;
