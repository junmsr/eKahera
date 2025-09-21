import React from "react";

export default function Header({
  title,
  subtitle,
  headerActions,
  className = "",
}) {
  return (
    <header
      className={`flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shadow-sm ${className}`}
    >
      <div className="flex flex-col">
        <h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent tracking-tight leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm md:text-base text-gray-600 mt-1 font-medium tracking-wide">
            {subtitle}
          </p>
        )}
      </div>

      {/* Header Actions */}
      {headerActions && (
        <div className="flex items-center gap-4 ml-4">{headerActions}</div>
      )}
    </header>
  );
}
