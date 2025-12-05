import React, { useRef, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import Background from "./Background";
import Navbar from "./Navbar";
import Footer from "./Footer";
import Header from "./Header";
import Button from "../common/Button";

/**
 * PageLayout Component
 * Provides consistent page structure with header, sidebar, navbar, footer, and main content
 */
export default function PageLayout({
  children,
  title,
  subtitle,
  sidebar,
  headerActions,
  showHeader = true,
  showNavbar = false,
  showFooter = false,
  className = "",
  isSidebarOpen,
  setSidebarOpen,
}) {
  const [theme, setTheme] = useState("light");
  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");
  const touchStartXRef = useRef(null);
  const touchActiveRef = useRef(false);
  const { logout } = useAuth();

  const handleLogoutClick = () => {
    // Logout is handled by Nav-Admin component's modal
    // This function is passed to Nav-Admin and called when user confirms logout
    logout();
  };

  return (
    <Background
      variant="white"
      pattern={undefined}
      overlay={false}
      floatingElements={false}
      className={theme}
    >

      {/* Navbar */}
      {showNavbar && <Navbar />}
      <div
        className={`flex h-screen relative ${className} ${theme}`}
        onTouchStart={(e) => {
          if (window.innerWidth >= 768) return;
          const x = e.touches?.[0]?.clientX ?? 0;
          if (!isSidebarOpen && x <= 24) {
            touchActiveRef.current = true;
            touchStartXRef.current = x;
          } else if (isSidebarOpen) {
            touchActiveRef.current = true;
            touchStartXRef.current = x;
          }
        }}
        onTouchMove={(e) => {
          if (!touchActiveRef.current) return;
          const x = e.touches?.[0]?.clientX ?? 0;
          const delta = x - (touchStartXRef.current ?? x);
          if (!isSidebarOpen && delta > 60) {
            setSidebarOpen(true);
            touchActiveRef.current = false;
            touchStartXRef.current = null;
          } else if (isSidebarOpen && delta < -60) {
            setSidebarOpen(false);
            touchActiveRef.current = false;
            touchStartXRef.current = null;
          }
        }}
        onTouchEnd={() => {
          touchActiveRef.current = false;
          touchStartXRef.current = null;
        }}
      >
        {/* Sidebar Desktop */}
        {sidebar && (
          <aside className="hidden md:block fixed top-0 left-0 h-full z-50">
            {React.cloneElement(sidebar, { onLogoutClick: handleLogoutClick })}
          </aside>
        )}
        {/* Sidebar Mobile Off-canvas */}
        {sidebar && (
          <aside
            className={`md:hidden fixed inset-y-0 left-0 z-50 w-48 max-w-[80vw] bg-white shadow-xl transform transition-transform duration-300 ${
              isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
            role="dialog"
            aria-modal="true"
          >
            {React.cloneElement(sidebar, { isMobile: true, onLogoutClick: handleLogoutClick })}
          </aside>
        )}
        {sidebar && isSidebarOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black/30 z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div
          className={`flex-1 flex flex-col transition-all duration-300 ${sidebar ? "md:ml-48" : ""} ${isSidebarOpen ? "blur-sm" : ""}`}
        >
          <main className="flex-1">
            {/* Header */}
            {showHeader && (
              <Header
                title={title}
                subtitle={subtitle}
                headerActions={headerActions}
                isMobileNavOpen={isSidebarOpen}
                onMenuClick={() => setSidebarOpen(!isSidebarOpen)}
                className="bg-white"
              />
            )}

            {/* Page Content */}
            <div className="flex-1 relative">{children}</div>
          </main>

          {/* Footer */}
          {showFooter && <Footer className="z-50" />}
        </div>
      </div>
    </Background>
  );
}
