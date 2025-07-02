import React from 'react';

function Button({ label, children, onClick, type = 'button', className = '', variant = 'primary', disabled }) {
  const base = "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400";
  const variants = {
    primary: "bg-purple-600 text-white hover:bg-purple-700",
    secondary: "bg-gray-100 text-gray-800 hover:bg-gray-200",
    outline: "border border-purple-600 text-purple-600 bg-white hover:bg-purple-50"
  };
  const disabledStyle = "opacity-50 cursor-not-allowed";
  return (
    <button
      type={type}
      onClick={onClick}
      className={`${base} ${variants[variant]} ${disabled ? disabledStyle : ''} ${className}`}
      disabled={disabled}
    >
      {children ? children : label}
    </button>
  );
}

export default Button;