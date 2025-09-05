import React from "react";

/**
 * Decorative image divider used between sections.
 * Always aria-hidden for screen readers.
 */
function ImageDivider({ src, className = "", style = {}, overlay = false }) {
  return (
    <div style={{ position: "relative", width: "100%", zIndex: 2, ...style }}>
      <img
        src={src}
        alt="" // decorative divider
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        className={`w-full h-auto object-cover pointer-events-none select-none ${className}`}
        style={{ display: "block" }}
      />
      {overlay && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 40,
            background:
              "linear-gradient(to bottom, rgba(255,255,255,0) 0%, #fff 100%)",
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
}

export default ImageDivider;
