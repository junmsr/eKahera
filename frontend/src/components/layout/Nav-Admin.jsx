import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import Logo from "../common/Logo";
import LogoutModal from "../modals/LogoutModal";

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
];

// Styling constants
const STYLES = {
  sidebar:
    "bg-gray-100 border-r border-gray-200 shadow-sm flex flex-col py-4 px-4 w-48 h-screen fixed z-20",
  logoContainer: "mb-8 flex items-center gap-3 group cursor-pointer px-2",
  logoText:
    "text-gray-800 font-semibold text-lg tracking-wide transition-all duration-300 group-hover:text-gray-900",
  nav: "flex-col gap-10 w-full",
  navItem:
    "group flex items-center w-full py-3 px-3 rounded-lg transition-all duration-200 font-medium text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 relative",
  navItemActive: "bg-blue-600 text-white shadow-sm",
  navItemInactive:
    "bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-800",
  iconContainer: "mr-3 relative flex-shrink-0",
  label: "leading-tight",
  tooltip:
    "absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs rounded-md px-2 py-1 shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50 whitespace-nowrap",
  sectionHeader:
    "text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2 mt-0 px-3",
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
 * @returns {JSX.Element} The admin navigation sidebar
 */
const NavAdmin = () => {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = () => {
    setShowLogoutModal(false);
    navigate("/");
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };

  return (
    <>
      <aside className={STYLES.sidebar}>
        <div
          className={`${STYLES.logoContainer} logoContainer`}
          onClick={handleLogoClick}
        >
          <div className="transition-all duration-300 group-hover:scale-110">
            <Logo size={42} />
          </div>
        </div>

        <nav className={STYLES.nav} aria-label="Main navigation">
          <div className={STYLES.sectionHeader}>MENU</div>
          {NAV_ITEMS.map((item) => (
            <NavigationItem
              key={item.id}
              item={item}
              isActive={window.location.pathname === item.path}
            />
          ))}
        </nav>
      </aside>

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={handleLogoutCancel}
        onConfirm={handleLogoutConfirm}
      />
    </>
  );
};

export default NavAdmin;
