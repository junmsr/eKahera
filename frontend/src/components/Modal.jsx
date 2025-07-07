import React from 'react';

function Modal({ isOpen, onClose, title, children, size = 'md', variant = 'glass' }) {
  if (!isOpen) return null;
  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
  };
  const variants = {
    glass: 'bg-white/60 backdrop-blur-xl border border-white/30',
    dark: 'bg-gray-900/90 text-white',
    default: 'bg-white',
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity duration-200" role="dialog" aria-modal="true">
      <div className={`${variants[variant]} rounded-3xl shadow-2xl p-8 w-full ${sizes[size]} relative animate-fadeIn`}>
        {title && <h3 className="text-2xl font-bold mb-4 tracking-tight text-blue-900 drop-shadow">{title}</h3>}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-blue-400 hover:text-blue-700 text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-full transition-colors duration-150"
          aria-label="Close"
        >
          &times;
        </button>
        {children}
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.3s; }
      `}</style>
    </div>
  );
}

export default Modal;
