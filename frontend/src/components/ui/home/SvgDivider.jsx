import React from "react";

/**
 * Small centered svg divider used between About and FAQ.
 */
function SvgDivider({ className = "my-1" }) {
  return (
    <div className={`w-full flex items-center justify-center ${className}`}>
      <svg
        width="320"
        height="16"
        viewBox="0 0 320 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="section divider"
      >
        <line
          x1="0"
          y1="8"
          x2="140"
          y2="8"
          stroke="#CBD5E1"
          strokeWidth="2"
          strokeDasharray="8 8"
        />
        <circle cx="160" cy="8" r="6" fill="#2563eb" />
        <line
          x1="180"
          y1="8"
          x2="320"
          y2="8"
          stroke="#CBD5E1"
          strokeWidth="2"
          strokeDasharray="8 8"
        />
      </svg>
    </div>
  );
}

export default SvgDivider;
