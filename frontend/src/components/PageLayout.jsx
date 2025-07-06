import React from 'react';
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
  backgroundVariant = "gradientPurple",
  showHeader = true,
  showNavbar = false,
  showFooter = false,
  navbarVariant = "default",
  footerVariant = "default",
  className = ""
}) {
  return (
    <Background variant={backgroundVariant} pattern="dots" overlay floatingElements>
      <div className={`flex flex-col min-h-screen ${className}`}>
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
          <main className="flex-1 flex flex-col">
            {/* Header */}
            {showHeader && (
              <header className="flex items-center justify-between px-8 py-6 border-b border-purple-200 bg-gradient-to-r from-purple-100 via-purple-50 to-white/80 shadow-md">
                <div className="flex items-center gap-4">
                  <Logo size={40} />
                  <h1 className="text-2xl font-extrabold text-purple-800 tracking-tight drop-shadow">
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