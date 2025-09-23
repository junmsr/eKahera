import React from "react";

/**
 * SectionHeader Component
 * A consistent heading component for section titles
 */
function SectionHeader({
  children,
  className = "",
  variant = "default",
  size = "lg",
  align = "center",
}) {
  // Base styles
  const baseStyles =
    "font-extrabold tracking-tight text-blue-700 drop-shadow-sm";

  // Size variants
  const sizeStyles = {
    sm: "text-lg md:text-xl mb-4",
    md: "text-xl md:text-2xl mb-5",
    lg: "text-2xl md:text-3xl mb-6",
    xl: "text-3xl md:text-4xl mb-8",
  };

  // Alignment variants
  const alignStyles = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  // Variant styles
  const variantStyles = {
    default: "text-gray-800",
    light: "text-blue-100",
    dark: "text-blue-900",
    white: "text-white",
  };

  // Combine all styles
  const combinedStyles = `${baseStyles} ${sizeStyles[size]} ${alignStyles[align]} ${variantStyles[variant]} ${className}`;

  return <h2 className={combinedStyles}>{children}</h2>;
}

export default SectionHeader;
