import React from 'react';

function Logo({ size = 48, className = '' }) {
  return (
    <div
      className={`bg-white rounded-full flex items-center justify-center shadow-md ${className}`}
      style={{ width: size, height: size }}
    >
      <span className="text-purple-600 font-bold" style={{ fontSize: size * 0.4 }}>
        eK
      </span>
    </div>
  );
}

export default Logo; 