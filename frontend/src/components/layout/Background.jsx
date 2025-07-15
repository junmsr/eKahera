import React from "react";
import vector1 from "../../assets/images/vector1.png";
import vector2 from "../../assets/images/vector2.png";

const Background = ({
  variant = "gradientBlue",
  pattern,
  overlay,
  floatingElements,
  className = "",
  children,
}) => {
  let backgroundStyle = {};
  if (variant === "gradientBlue") {
    backgroundStyle.background = "#e6f0ff"; // slightly lighter blue
  }

  const patternStyle = pattern === "dots"
    ? {
        backgroundImage:
          "url('data:image/svg+xml;utf8,<svg width='40' height='40' viewBox='0 0 40 40' fill='none' xmlns='http://www.w3.org/2000/svg'><circle cx='1' cy='1' r='1' fill='%23bcd0ee' fill-opacity='0.25'/></svg>')",
        backgroundRepeat: "repeat",
        backgroundSize: "40px 40px",
        pointerEvents: "none",
        position: "absolute",
        inset: 0,
        zIndex: 1,
      }
    : null;

  const overlayStyle = overlay
    ? {
        background:
          "linear-gradient(180deg, rgba(59,130,246,0.07) 0%, rgba(255,255,255,0.7) 100%)",
        position: "absolute",
        inset: 0,
        zIndex: 2,
        pointerEvents: "none",
      }
    : null;

  return (
    <div className={`relative w-full min-h-screen ${className}`} style={{zIndex:0}}>
      {/* Background Layer */}
      <div className="absolute inset-0 w-full h-full pointer-events-none select-none z-0" style={backgroundStyle} />
      {/* Pattern overlay */}
      {pattern && <div style={patternStyle} aria-hidden="true" />}
      {/* Overlay */}
      {overlay && <div style={overlayStyle} aria-hidden="true" />}
      {/* Floating decorative vectors */}
      {floatingElements && (
        <>
          <img
            src={vector1}
            alt="decorative vector 1"
            className="absolute top-0 left-0 w-40 md:w-56 opacity-40 blur-sm pointer-events-none select-none z-10"
            style={{ transform: "translate(-30%, -30%)" }}
            aria-hidden="true"
          />
          <img
            src={vector2}
            alt="decorative vector 2"
            className="absolute bottom-0 right-0 w-40 md:w-56 opacity-40 blur-sm pointer-events-none select-none z-10"
            style={{ transform: "translate(30%, 30%)" }}
            aria-hidden="true"
          />
        </>
      )}
      {/* Children (content above background) */}
      <div className="relative z-20 w-full">{children}</div>
    </div>
  );
};

export default Background;
