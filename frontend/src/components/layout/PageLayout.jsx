import React, { useState } from "react";
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

  return (
    <Background
      variant="white"
      pattern={undefined}
      overlay={false}
      floatingElements={false}
      className={theme}
    >
      <div className={`flex min-h-screen relative ${className} ${theme}`}>
        {/* Sidebar */}
        {sidebar && (
          <aside className="fixed top-0 left-0 h-full z-50">{sidebar}</aside>
        )}

        {/* Main Content */}
        <main className={`flex-1 flex flex-col ${sidebar ? "ml-48" : ""}`}>
          {/* Header */}
          {showHeader && (
            <Header
              title={title}
              subtitle={subtitle}
              headerActions={headerActions}
              className="sticky top-0 z-0 bg-white"
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
