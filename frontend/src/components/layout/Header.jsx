import React from "react";

const Header = ({
  title,
  subtitle,
  headerActions,
  onMenuClick,
  isMobileNavOpen,
  className = "",
}) => {
  return (
    <header
      className={`sticky top-0 z-40 bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-200/50 ${className}`}
    >
      <div className="px-4 lg:px-6">
        <div className="grid grid-cols-[1fr_auto] items-center h-16 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {onMenuClick && (
              <button
                type="button"
                onClick={onMenuClick}
                className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-md transition-transform duration-200 flex-shrink-0"
                aria-label={isMobileNavOpen ? "Close menu" : "Open menu"}
                aria-expanded={isMobileNavOpen}
              >
                {isMobileNavOpen ? (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h7"
                    />
                  </svg>
                )}
              </button>
            )}
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-gray-600 font-medium truncate">
                {subtitle}
              </p>
            )}
          </div>

          {/* Header Actions */}
          {headerActions && (
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              {headerActions}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
