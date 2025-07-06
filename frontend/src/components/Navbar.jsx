import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

// Components
import Button from "./Button";
import Logo from "./Logo";

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
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
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
    default: "bg-gradient-to-r from-purple-600/80 via-purple-400/80 to-purple-300/80 border-purple-200/60",
    transparent: "bg-transparent border-transparent",
    solid: "bg-purple-600 border-purple-200"
  };

  // Scrolled styles
  const scrolledStyles = isScrolled ? "bg-purple-600/95 shadow-2xl" : "";

  // Combine styles
  const combinedStyles = `${baseStyles} ${variantStyles[variant]} ${scrolledStyles} ${className}`;

  return (
    <nav className={combinedStyles}>
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
            className={`hover:text-yellow-200 font-medium transition-colors ${
              location.pathname === item.path ? "text-yellow-200" : ""
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
              variant="secondary"
              className="bg-yellow-400 hover:bg-yellow-300 text-purple-900 px-6 py-2 rounded-full font-medium shadow-md transition-colors"
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
          className="bg-transparent hover:bg-yellow-200/20 text-white px-2 py-2 font-medium transition-colors border-2 border-white/20 rounded-xl"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </Button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 mt-2 bg-gradient-to-r from-purple-600/95 via-purple-400/95 to-purple-300/95 backdrop-blur-md border border-purple-200/60 shadow-xl z-50 flex flex-col items-start px-6 py-4 space-y-4 rounded-xl">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              className={`hover:text-yellow-200 font-medium w-full transition-colors ${
                location.pathname === item.path ? "text-yellow-200" : ""
              }`}
              onClick={closeMenu}
            >
              {item.label}
            </Link>
          ))}
          
          {showGetStarted && (
            <Link to="/get-started" className="w-full" onClick={closeMenu}>
              <Button
                variant="secondary"
                className="bg-yellow-400 hover:bg-yellow-300 text-purple-900 px-6 py-2 rounded-full font-medium w-full shadow-md transition-colors"
              >
                Get Started
              </Button>
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}

export default Navbar;
