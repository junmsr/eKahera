import React from "react";

/**
 * Loader Component
 * A customizable loading spinner with multiple sizes and colors
 */
function Loader({
  className = "",
  size = "md",
  variant = "spinner",
  color = "blue",
}) {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };
  return (
    <svg
      className={`${
        sizes[size] || sizes.md
      } animate-spin text-gray-700 ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      role="img"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      ></path>
    </svg>
  );
}

export default Loader;
