import React from 'react';
import Input from './Input';

/**
 * FormField Component
 * A form field wrapper with label, input, and error handling
 */
export default function FormField({ 
  label, 
  name, 
  value, 
  onChange, 
  placeholder, 
  type = "text",
  error, 
  required = false,
  className = "",
  ...props 
}) {
  return (
    <div className={`mb-5 ${className}`}>
      {/* Label */}
      <label className="block mb-1 font-medium text-blue-800">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {/* Input */}
      <Input
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        type={type}
        error={error}
        {...props}
      />
    </div>
  );
} 