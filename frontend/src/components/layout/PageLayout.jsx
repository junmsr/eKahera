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
      <div
        className={`flex flex-col min-h-screen ${className} ${theme}`}
        role="main"
        aria-label="Main content area"
      >
        {/* Navbar */}
        {showNavbar && <Navbar />}

        {/* Main Content Area */}
        <div className="flex flex-1">
          {/* Sidebar */}
          {sidebar && <aside className="flex-shrink-0">{sidebar}</aside>}

          {/* Main Content */}
          <main className={`flex-1 flex flex-col${sidebar ? " ml-32" : ""}`}>
            {/* Header */}
            {showHeader && (
              <Header
                title={title}
                subtitle={subtitle}
                headerActions={headerActions}
              />
            )}

            {/* Page Content */}
            <div className="flex-1">{children}</div>
          </main>
        </div>

        {/* Footer */}
        {showFooter && <Footer />}
      </div>
    </Background>
  );
}
