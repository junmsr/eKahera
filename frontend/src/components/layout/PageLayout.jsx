import React, { useRef, useState } from "react";
import Background from "./Background";
import Navbar from "./Navbar";
import Footer from "./Footer";
import Header from "./Header";

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
}) {
  const [theme, setTheme] = useState("light");
  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const touchStartXRef = useRef(null);
  const touchActiveRef = useRef(false);

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
      {/* Spacer to offset fixed navbar (disabled for compact top spacing) */}
      {showNavbar && <div className="h-0" aria-hidden="true" />}
      <div
        className={`flex min-h-screen relative ${className} ${theme}`}
        onTouchStart={(e) => {
          if (window.innerWidth >= 768) return;
          const x = e.touches?.[0]?.clientX ?? 0;
          if (!isMobileNavOpen && x <= 24) {
            touchActiveRef.current = true;
            touchStartXRef.current = x;
          } else if (isMobileNavOpen) {
            touchActiveRef.current = true;
            touchStartXRef.current = x;
          }
        }}
        onTouchMove={(e) => {
          if (!touchActiveRef.current) return;
          const x = e.touches?.[0]?.clientX ?? 0;
          const delta = x - (touchStartXRef.current ?? x);
          if (!isMobileNavOpen && delta > 60) {
            setIsMobileNavOpen(true);
            touchActiveRef.current = false;
            touchStartXRef.current = null;
          } else if (isMobileNavOpen && delta < -60) {
            setIsMobileNavOpen(false);
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
          <aside className="hidden md:block fixed top-0 left-0 h-full z-50">{sidebar}</aside>
        )}
        {/* Sidebar Mobile Off-canvas */}
        {sidebar && (
          <aside
            className={`md:hidden fixed inset-y-0 left-0 z-50 w-64 max-w-[80vw] bg-white shadow-xl transform transition-transform duration-300 ${isMobileNavOpen ? "translate-x-0" : "-translate-x-full"}`}
          >
            {sidebar}
          </aside>
        )}
        {sidebar && isMobileNavOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black/30 z-40"
            onClick={() => setIsMobileNavOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className={`flex-1 flex flex-col ${sidebar ? "md:ml-48" : ""}`}>
          {/* Header */}
          {showHeader && (
            <Header
              title={title}
              subtitle={subtitle}
              headerActions={headerActions}
              className="sticky top-0 z-50 bg-white"
            />
          )}

          {/* Page Content */}
          <div className="flex-1 relative z-40 overflow-x-hidden">
            {children}
          </div>
        </main>

        {/* Footer */}
        {showFooter && <Footer className="z-50" />}
      </div>
    </Background>
  );
}
