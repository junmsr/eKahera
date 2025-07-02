import React from 'react';

function SectionHeader({ children, className = '' }) {
  return (
    <h2 className={`text-2xl md:text-3xl font-extrabold mb-6 text-center tracking-tight text-purple-700 drop-shadow-sm ${className}`}>
      {children}
    </h2>
  );
}

export default SectionHeader; 