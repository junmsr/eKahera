import React from 'react';

function Input({ type = 'text', name, value, onChange, placeholder = '', className = '', error, variant = 'default', ...props }) {
  const variants = {
    default: `w-full border rounded-lg px-4 py-2 text-base transition focus:outline-none focus:ring-2 focus:ring-purple-400 placeholder-gray-400 ${error ? 'border-red-400 ring-red-200' : 'border-gray-300'}`,
    bordered: `w-full border-2 rounded-lg px-4 py-2 text-base transition focus:outline-none focus:ring-2 focus:ring-purple-400 placeholder-gray-400 ${error ? 'border-red-400 ring-red-200' : 'border-purple-400'}`,
    underline: `w-full border-b-2 px-4 py-2 text-base transition focus:outline-none focus:ring-2 focus:ring-purple-400 placeholder-gray-400 ${error ? 'border-red-400 ring-red-200' : 'border-purple-400'}`
  };
  return (
    <div>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`${variants[variant]} ${className}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
        {...props}
      />
      {error && <p id={`${name}-error`} className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

export default Input;
