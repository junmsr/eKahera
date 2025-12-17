import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import Logo from "../common/Logo";

// Navigation configuration for Demo
const NAV_ITEMS = [
  {
    id: "dashboard",
    label: "Dashboard",
    path: "/demo/dashboard",
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
    path: "/demo/pos",
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
    path: "/demo/cashiers",
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
    path: "/demo/inventory",
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
    path: "/demo/logs",
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
    path: "/demo/profile",
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

const DemoNav = ({ isMobile }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // For demo, just go back to home
    navigate("/");
  };

  return (
    <aside className={STYLES.sidebar}>
      <div
        className={STYLES.logoContainer}
        onClick={() => navigate("/demo/dashboard")}
        role="button"
      >
        <div className="transition-all duration-300">
          <Logo size={42} />
        </div>
      </div>

      <nav
        className={`${STYLES.nav} h-full flex flex-col overflow-y-auto overflow-x-hidden`}
      >
        <div className={STYLES.sectionHeader}>DEMO MENU</div>
        {NAV_ITEMS.map((item) => (
          <NavigationItem
            key={item.id}
            item={item}
            isActive={window.location.pathname === item.path}
          />
        ))}

        <div className={`${isMobile ? "block" : "mt-auto"}`}>
          <button onClick={handleLogout} className={STYLES.logoutButton}>
            <span className="mr-3 flex-shrink-0">
              <svg
                className="w-5 h-5 text-red-500"
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
            </span>
            <span className={STYLES.label}>Exit Demo</span>
          </button>
        </div>
      </nav>
    </aside>
  );
};

export default DemoNav;
