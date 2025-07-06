import React, { useState } from 'react';
import Background from './Background';
import Logo from './Logo';
import Navbar from './Navbar';
import Footer from './Footer';

/**
 * PageLayout Component
 * Provides consistent page structure with header, sidebar, navbar, footer, and main content
 */
export default function PageLayout({ 
  children, 
  title, 
  sidebar, 
  headerActions,
  backgroundVariant = "gradientBlue",
  showHeader = true,
  showNavbar = false,
  showFooter = false,
  navbarVariant = "default",
  footerVariant = "default",
  className = ""
}) {
  const [theme, setTheme] = useState('light');
  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');
  return (
    <Background variant={backgroundVariant} pattern="dots" overlay floatingElements className={theme}>
      <div className={`flex flex-col min-h-screen ${className} ${theme}`} role="main" aria-label="Main content area">
        {/* Navbar */}
        {showNavbar && (
          <Navbar variant={navbarVariant} />
        )}
        
        {/* Main Content Area */}
        <div className="flex flex-1">
          {/* Sidebar */}
          {sidebar && (
            <aside className="flex-shrink-0">
              {sidebar}
            </aside>
          )}
          
          {/* Main Content */}
          <main className={`flex-1 flex flex-col${sidebar ? ' ml-32' : ''}`}>
            {/* Header */}
            {showHeader && (
              <header className="flex items-center justify-between px-9 py-6 border-b border-blue-200 bg-gradient-to-r from-blue-100 via-blue-50 to-white/80 shadow-md">
                <div className="flex items-center gap-4">
                  <Logo size={40} />
                  <h1 className="text-2xl font-extrabold text-blue-800 tracking-tight drop-shadow">
                    {title}
                  </h1>
                </div>
                
                {/* Header Actions */}
                {headerActions && (
                  <div className="flex items-center gap-4">
                    {headerActions}
                  </div>
                )}
              </header>
            )}
            
            {/* Page Content */}
            <div className="flex-1">
              {children}
            </div>
          </main>
        </div>
        
        {/* Footer */}
        {showFooter && (
          <Footer variant={footerVariant} />
        )}
      </div>
    </Background>
  );
} 