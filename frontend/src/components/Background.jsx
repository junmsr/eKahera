import React from "react";

const Background = ({
  variant = "gradient",
  className = "",
  children,
  pattern = "dots",
  overlay = true,
  floatingElements = true,
  cardBackground = false,
}) => {
  const baseClasses = "min-h-screen w-full relative overflow-hidden";

  const variants = {
    gradient: "bg-gradient-to-br from-blue-50 via-blue-50 to-indigo-50",
    gradientBlue: "bg-gradient-to-br from-blue-100 via-blue-50 to-white",
    solid: "bg-white",
    dark: "bg-gray-900",
  };

  const patterns = {
    none: "",
    dots: "bg-[radial-gradient(circle_at_1px_1px,rgba(59,130,246,0.10)_1px,transparent_0)] bg-[length:18px_18px]",
    grid: "bg-[linear-gradient(rgba(59,130,246,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.06)_1px,transparent_1px)] bg-[length:20px_20px]",
    waves:
      'bg-[url(\'data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%233B82F6" fill-opacity="0.07"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\')]',
    geometric:
      'bg-[url(\'data:image/svg+xml,%3Csvg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%233B82F6" fill-opacity="0.07" fill-rule="evenodd"%3E%3Cpath d="M0 40L40 0H20L0 20M40 40V20L20 40"/%3E%3C/g%3E%3C/svg%3E\')]',
  };

  const overlayClasses = overlay
    ? "before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_60%_20%,rgba(59,130,246,0.18)_0,transparent_60%),radial-gradient(circle_at_20%_80%,rgba(37,99,235,0.13)_0,transparent_70%)] before:pointer-events-none"
    : "";

  return (
    <div
      className={`${baseClasses} ${variants[variant]} ${patterns[pattern]} ${overlayClasses} ${className}`}
      style={{ position: "relative" }}
    >
      {/* Blue radial glow effect */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(circle at 50% 50%, rgba(37,99,235,0.55) 0%, rgba(59,130,246,0.25) 40%, transparent 80%)",
        }}
      />
      {/* Floating decorative elements */}
      {floatingElements && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-24 left-10 w-40 h-40 bg-blue-200/30 rounded-full blur-2xl animate-float1"></div>
          <div className="absolute top-1/2 right-20 w-28 h-28 bg-blue-200/30 rounded-full blur-2xl animate-float2"></div>
          <div className="absolute bottom-32 left-1/4 w-24 h-24 bg-indigo-200/30 rounded-full blur-2xl animate-float3"></div>
          <div className="absolute bottom-16 right-1/3 w-32 h-32 bg-blue-300/20 rounded-full blur-2xl animate-float4"></div>
        </div>
      )}

      {/* Card background pattern */}
      {cardBackground && (
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_1px_1px,rgba(59,130,246,0.3)_1px,transparent_0)] bg-[length:20px_20px]"></div>
        </div>
      )}

      <div className="relative z-10">{children}</div>

      <style>{`
        @keyframes float1 { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-20px);} }
        @keyframes float2 { 0%,100%{transform:translateY(0);} 50%{transform:translateY(15px);} }
        @keyframes float3 { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-10px);} }
        @keyframes float4 { 0%,100%{transform:translateY(0);} 50%{transform:translateY(25px);} }
        .animate-float1 { animation: float1 7s ease-in-out infinite; }
        .animate-float2 { animation: float2 9s ease-in-out infinite; }
        .animate-float3 { animation: float3 8s ease-in-out infinite; }
        .animate-float4 { animation: float4 10s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default Background;
