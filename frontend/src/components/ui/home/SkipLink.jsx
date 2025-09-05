import React from "react";

/**
 * Small skip link used on pages — keep styling inline to avoid global CSS dependency.
 */
function SkipLink() {
  return (
    <a
      href="#main-content"
      onFocus={(e) => {
        e.currentTarget.style.left = "16px";
      }}
      onBlur={(e) => {
        e.currentTarget.style.left = "-9999px";
      }}
      style={{
        position: "absolute",
        left: "-9999px",
        top: "8px",
        zIndex: 9999,
        background: "#fff",
        color: "#2563eb",
        padding: "8px 12px",
        borderRadius: "6px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        textDecoration: "none",
        fontWeight: 600,
      }}
    >
      Skip to content
    </a>
  );
}

export default SkipLink;
