import React from "react";
import { NavLink } from "react-router-dom";
import Logo from "../common/Logo";

// Navigation configuration
const NAV_ITEMS = [
  {
    id: "dashboard",
    label: "Dashboard",
    path: "/dashboard",
    icon: (
      <svg
        width="28"
        height="28"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        viewBox="0 0 24 24"
      >
        <rect x="3" y="3" width="7" height="7" rx="2" />
        <rect x="14" y="3" width="7" height="7" rx="2" />
        <rect x="14" y="14" width="7" height="7" rx="2" />
        <rect x="3" y="14" width="7" height="7" rx="2" />
      </svg>
    ),
  },
  {
    id: "pos",
    label: "POS",
    path: "/pos",
    icon: (
      <svg
        width="28"
        height="28"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        viewBox="0 0 24 24"
      >
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M16 3v4M8 3v4" />
      </svg>
    ),
  },
  {
    id: "cashiers",
    label: "Cashiers",
    path: "/cashiers",
    icon: (
      <svg
        width="28"
        height="28"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="7" r="4" />
        <path d="M5.5 21a7.5 7.5 0 0 1 13 0" />
      </svg>
    ),
  },
  {
    id: "inventory",
    label: "Inventory",
    path: "/inventory",
    icon: (
      <svg
        width="28"
        height="28"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        viewBox="0 0 24 24"
      >
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M16 3v4M8 3v4" />
      </svg>
    ),
  },
  {
    id: "logs",
    label: "Logs",
    path: "/logs",
    icon: (
      <svg
        width="28"
        height="28"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        viewBox="0 0 24 24"
      >
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M9 7h6M9 11h6M9 15h2" />
      </svg>
    ),
  },
  {
    id: "profile",
    label: "Profile",
    path: "/profile",
    icon: (
      <svg
        width="28"
        height="28"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        viewBox="0 0 24 24"
      >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

// Styling constants
const STYLES = {
  sidebar:
    "bg-white/20 backdrop-blur-md border-r border-white/30 shadow-xl flex flex-col py-4 px-4 w-48 h-screen fixed z-20",
  logoContainer: "mb-8 flex items-center gap-3 group cursor-pointer px-2",
  logoText:
    "text-gray-800 font-semibold text-lg tracking-wide transition-all duration-300 group-hover:text-gray-900",
  nav: "flex-col gap-5 w-full",
  navItem:
    "group flex items-center w-full py-3 px-3 rounded-lg transition-all duration-200 font-medium text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 relative",
  navItemActive: "bg-blue-600/80 backdrop-blur-sm text-white shadow-lg",
  // navItemInactive: "bg-transparent text-gray-700 hover:bg-blue/30 hover:text-gray-900 hover:backdrop-blur-sm",
  // navItemActive: "bg-blue-600/80 backdrop-blur-sm text-white shadow-lg",
  // navItemInactive: "bg-transparent text-gray-700 hover:bg-blue/30 hover:text-gray-900 hover:backdrop-blur-sm",
  // navItemActive: "bg-blue-600/80 backdrop-blur-sm text-white shadow-lg",
// improved hover highlight for inactive items
 navItemInactive:
   "bg-transparent text-gray-700 hover:bg-blue-100 hover:text-gray-900 hover:backdrop-blur-sm",
  iconContainer: "mr-3 relative flex-shrink-0",
  label: "leading-tight",
  tooltip:
    "absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs rounded-md px-2 py-1 shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50 whitespace-nowrap",
  sectionHeader:
    "text-gray-600 text-xs font-semibold uppercase tracking-wider mb-2 mt-0 px-3",
  logoutButton:
    "mt-auto flex items-center w-full py-3 px-3 rounded-lg transition-all duration-200 font-medium text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 hover:backdrop-blur-sm hover:shadow-md relative group",
  logoutIcon: "mr-3 flex-shrink-0",
};

// Color constants
const COLORS = {
  activeIcon: "#ffffff",
  inactiveIcon: "#4b5563",
};

/**
 * Navigation item component
 */
const NavigationItem = ({ item, isActive }) => {
  const iconColor = isActive ? COLORS.activeIcon : COLORS.inactiveIcon;

  return (
    <NavLink
      key={item.id}
      to={item.path}
      aria-label={item.label}
      className={`${STYLES.navItem} ${
        isActive ? STYLES.navItemActive : STYLES.navItemInactive
      }`}
      tabIndex={0}
    >
      <span className={STYLES.iconContainer}>
        {React.cloneElement(item.icon, {
          stroke: iconColor,
          width: "20",
          height: "20",
        })}
      </span>
      <span className={STYLES.label}>{item.label}</span>
      <span className={STYLES.tooltip}>{item.label}</span>
    </NavLink>
  );
};

/**
 * Admin Navigation Sidebar Component
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isMobile - Whether the view is in mobile mode
 * @param {Function} props.onLogoutClick - Function to call when logout is confirmed
 * @returns {JSX.Element} The admin navigation sidebar
 */
const NavAdmin = ({ isMobile, onLogoutClick }) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);
  
  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    if (onLogoutClick) {
      onLogoutClick();
    }
  };

  const handleCloseModal = () => {
    setShowLogoutConfirm(false);
  };
  const LogoutIcon = () => (
    <svg
      className="w-5 h-5 text-white"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
      />
    </svg>
  );

  return (
    <>
      <aside className={STYLES.sidebar}>
        <div
          className={STYLES.logoContainer}
          onClick={() => navigate("/dashboard")}
          role="button"
          tabIndex={0}
        >
          <div className="transition-all duration-300">
            <Logo size={42} />
          </div>
        </div>

        <nav
          className={`${STYLES.nav} h-full flex flex-col overflow-y-auto overflow-x-hidden`}
          aria-label="Main navigation"
        >
          <div className={STYLES.sectionHeader}>MENU</div>
          {NAV_ITEMS.map((item) => (
            <NavigationItem
              key={item.id}
              item={item}
              isActive={window.location.pathname === item.path}
            />
          ))}

          {/* Logout Button */}
          <div className={`${isMobile ? "block" : "mt-auto"}`}>
            <button
              onClick={handleLogoutClick}
              className={STYLES.logoutButton}
              aria-label="Logout"
            >
              <span className={STYLES.logoutIcon}>
                <LogoutIcon />
              </span>
              <span className={STYLES.label}>Logout</span>
            </button>
          </div>
        </nav>
      </aside>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-90 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/80 z-90"
            onClick={handleCloseModal}
          />
          <div className="relative bg-white rounded-xl shadow-xl w-[92%] max-w-md z-100 p-0">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-red-50 via-red-50/80 to-orange-50/50 border-b border-red-100 px-6 py-5 rounded-t-2xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="white"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-1">
                    Confirm Logout
                  </h2>
                  <p className="text-sm text-gray-600">
                    Are you sure you want to log out?
                  </p>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className="p-6">
              <p className="text-sm text-gray-700 mb-6">
                You will be redirected to the login page and your session will be ended.
              </p>
              
              {/* Action Buttons */}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 rounded-lg text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmLogout}
                  className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NavAdmin;
