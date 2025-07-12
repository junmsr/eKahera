import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

// Components
import Button from "../common/Button";
import Logo from "../common/Logo";

/**
 * Mobile Menu Component
 * Internal component for mobile navigation
 */
function MobileMenu({ isOpen, navItems, showGetStarted, onClose, location }) {
  return (
    <div
      className={`md:hidden transition-all duration-300 ease-in-out ${
        isOpen ? "max-h-96 opacity-100 mt-4" : "max-h-0 opacity-0 overflow-hidden"
      }`}
    >
      <div className="flex flex-col items-start px-6 py-4 space-y-4 bg-gradient-to-r from-blue-600/95 via-blue-400/95 to-blue-300/95 backdrop-blur-md border border-blue-200/60 shadow-xl rounded-xl">
        {navItems.map((item) => (
          <Link
            key={item.label}
            to={item.path}
            className={`hover:text-blue-200 font-medium w-full transition-colors ${
              location.pathname === item.path ? "text-blue-200" : ""
            }`}
            onClick={onClose}
          >
            {item.label}
          </Link>
        ))}
        
        {showGetStarted && (
          <Link to="/get-started" className="w-full" onClick={onClose}>
            <Button
              className="bg-gradient-to-r from-blue-500 to-blue-700 text-white font-bold px-8 py-3 rounded-full shadow-lg hover:from-blue-600 hover:to-blue-800 hover:scale-105 active:scale-95 transition-all duration-200 text-lg w-full"
            >
              Get Started
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

/**
 * Navbar Component
 * Main navigation bar with responsive design and smooth scrolling
 */
function Navbar({ 
  variant = "default",
  showGetStarted = true,
  className = ""
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  // Navigation items
  const navItems = [
    { label: "Home", path: "/" },
    { label: "Features", path: "/features" },
    { label: "Services", path: "/services" },
    { label: "About Us", path: "/about" },
    { label: "Contact", path: "/contact" }
  ];

  // Handle scroll effect
  useEffect(() => {
    const nav = document.getElementById('main-navbar');
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
        nav.classList.add('navbar-scrolled');
      } else {
        setIsScrolled(false);
        nav.classList.remove('navbar-scrolled');
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Toggle mobile menu
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Close mobile menu
  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // Base styles
  const baseStyles = "items-center justify-between px-6 py-4 backdrop-blur-md border shadow-xl fixed top-3 left-1/2 transform -translate-x-1/2 w-full max-w-7xl z-50 text-white transition-all duration-300";
  
  // Variant styles
  const variantStyles = {
    default: "bg-gradient-to-r from-blue-600/80 via-blue-400/80 to-blue-300/80 border-blue-200/60",
    transparent: "bg-transparent border-transparent",
    solid: "bg-blue-600 border-blue-200"
  };

  // Scrolled styles
  const scrolledStyles = isScrolled ? "bg-blue-600/95 shadow-2xl" : "";

  // Combine styles
  const combinedStyles = `${baseStyles} ${variantStyles[variant]} ${scrolledStyles} ${className}`;

  return (
    <nav id="main-navbar" className={combinedStyles}>
      {/* Logo Section */}
      <div className="flex items-center space-x-2">
        <Logo size={32} />
        <span className="text-xl font-semibold text-white drop-shadow">
          eKahera
        </span>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center space-x-8">
        {navItems.map((item) => (
          <Link
            key={item.label}
            to={item.path}
            className={`hover:text-blue-200 font-medium transition-colors ${
              location.pathname === item.path ? "text-blue-200" : ""
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {/* Desktop Actions */}
      <div className="hidden md:flex items-center space-x-4">
        {showGetStarted && (
          <Link to="/get-started">
            <Button
              className="bg-gradient-to-r from-blue-500 to-blue-700 text-white font-bold px-8 py-3 rounded-full shadow-lg hover:from-blue-600 hover:to-blue-800 hover:scale-105 active:scale-95 transition-all duration-200 text-lg"
            >
              Get Started
            </Button>
          </Link>
        )}
      </div>

      {/* Mobile Menu Button */}
      <div className="md:hidden">
        <Button
          onClick={toggleMenu}
          variant="ghost"
          className="bg-transparent hover:bg-blue-200/20 text-white px-2 py-2 font-medium transition-colors border-2 border-white/20 rounded-xl"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </Button>
      </div>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMenuOpen}
        navItems={navItems}
        showGetStarted={showGetStarted}
        onClose={closeMenu}
        location={location}
      />
    </nav>
  );
}

export default Navbar;
