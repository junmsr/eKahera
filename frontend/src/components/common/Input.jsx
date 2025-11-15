import React from "react";

function Input({
  type = "text",
  name,
  value,
  onChange,
  placeholder = "",
  className = "",
  error,
  variant = "glass",
  suffix,
  size = "md",
  microinteraction = true,
  ...props
}) {
  // Base styles — use dark gray for normal text and gray for placeholder
  const baseStyles =
    "w-full rounded-xl text-base text-gray-900 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-blue-400 placeholder:text-gray-400 bg-white/60 backdrop-blur-md border border-white/30 shadow-sm";
  // Size variants
  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-4 py-3 text-lg",
  };
  // Variant styles
  const variantStyles = {
    glass: error
      ? "border-red-400 ring-red-200"
      : "border-white/30 hover:border-blue-300",
    bordered: error
      ? "border-red-400 ring-red-200"
      : "border-2 border-blue-400",
    underline: error
      ? "border-red-400 ring-red-200"
      : "border-b-2 border-blue-400 rounded-none",
    default: error
      ? "border-red-400 ring-red-200"
      : "border-gray-300 hover:border-blue-300",
  };
  // Microinteraction (scale on focus)
  const microClass = microinteraction
  // Combine all styles
  const combinedStyles = `${baseStyles} ${sizeStyles[size]} ${
    variantStyles[variant]
  } ${suffix ? "pr-10" : ""} ${microClass} ${className}`;
  return (
    <div className="relative">
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={combinedStyles}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
        {...props}
      />
      {/* Suffix (e.g., password toggle, icons) */}
      {suffix && (
        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-auto">
          {suffix}
        </div>
      )}
      {/* Error message */}
      {error && (
        <p
          id={`${name}-error`}
          className="text-red-500 text-xs mt-1 font-medium"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}

export default Input;
