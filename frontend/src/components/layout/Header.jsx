import React from "react";

const Header = ({ title, subtitle, headerActions, className = "" }) => {
  return (
    <header className={`sticky top-0 z-50 bg-gray-300 ${className}`}>
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex justify-between items-center h-16">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-gray-600 font-medium">{subtitle}</p>
            )}
          </div>

          {/* Header Actions */}
          {headerActions && (
            <div className="flex items-center gap-4">{headerActions}</div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
