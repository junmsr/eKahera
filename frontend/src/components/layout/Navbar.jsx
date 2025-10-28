import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Button from "../common/Button";
import Logo from "../common/Logo";
import "../../index.css";
import menuBar from "../../assets/images/menu-bar.png";

function Navbar({ className = "" }) {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { label: "Home", path: "/" },
    { label: "Features", path: "#features" },
    { label: "About", path: "#about" },
    { label: "FAQ", path: "#faq" },
  ];

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Scroll effect for navbar styling
  useEffect(() => {
    const nav = document.getElementById("main-navbar");
    const handleScroll = () => {
      if (window.scrollY > 10) {
        nav.classList.add("navbar-scrolled");
      } else {
        nav.classList.remove("navbar-scrolled");
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      id="main-navbar"
      className={`site-navbar-base flex items-center justify-between px-5 py-3 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 border border-blue-100 shadow-lg rounded-full fixed top-0 left-1/2 transform -translate-x-1/2 w-[95vw] max-w-4xl z-50 ${className}`}
      style={{ fontFamily: "Inter, sans-serif", fontWeight: 600 }}
      role="navigation"
      aria-label="Primary"
    >
      {/* Ensure only the centralized Logo is shown in the header */}
      <style>{`
        /* Hide other header images (duplicate logos) but keep the nav logo visible */
        header img:not(.nav-logo) { display: none !important; }
      `}</style>

      {/* Logo */}
      <div className="flex items-center space-x-2">
        <Link to="/" aria-label="eKahera home" className="flex items-center">
          {/* Use centralized Logo component and mark it as the nav logo */}
          <Logo size={42} className="nav-logo w-auto" />
        </Link>
      </div>

      {/* Desktop Navigation Menu */}
      <div className="hidden md:flex flex-1 items-center justify-center space-x-7" role="menubar">
        {navItems.map((item) => (
          <a
            key={item.label}
            href={item.path}
            className={`group relative text-slate-800 hover:text-blue-700 transition-colors text-base px-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400`}
            style={{ fontFamily: "Inter, sans-serif" }}
            role="menuitem"
          >
            {item.label}
            <span className="absolute left-0 -bottom-1 h-0.5 bg-blue-600 transition-all duration-300 w-0 group-hover:w-full" />
          </a>
        ))}
      </div>

      {/* Desktop Get Started Button */}
      <div className="hidden md:flex items-center">
        <a
          href="/get-started"
          className="text-white font-semibold px-6 py-2 rounded-full shadow-md bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 focus:from-blue-700 focus:to-blue-600 transition-all text-base"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          Get Started
        </a>
      </div>

      {/* Mobile Menu Button */}
      <div className="md:hidden">
        <Button aria-expanded={isMenuOpen} aria-controls="mobile-menu" onClick={toggleMenu} className="md:hidden bg-white hover:bg-blue-50 text-gray-800 px-2 py-2 font-medium transition-colors cursor-pointer border-opacity-20 rounded-xl border-2 border-blue-600 flex items-center" aria-label="Open menu">
          <img src={menuBar} alt="menu" className="w-5 h-5" />
        </Button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div id="mobile-menu" className="md:hidden absolute top-full left-1/2 transform -translate-x-1/2 w-[90vw] max-w-sm bg-white/95 backdrop-blur shadow-lg z-50 flex flex-col items-start px-6 py-5 space-y-5 rounded-xl border border-blue-100 mt-2" role="menu">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.path}
            className="text-gray-800 hover:text-blue-700 font-medium text-base w-full transition-colors"
              style={{ fontFamily: "Inter, sans-serif" }}
              onClick={() => setIsMenuOpen(false)}
              role="menuitem"
            >
              {item.label}
            </a>
          ))}
          <a
            href="/get-started"
            className="text-white px-7 py-3 rounded-full font-semibold text-base cursor-pointer w-full text-center transition-colors bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
            style={{ fontFamily: "Inter, sans-serif" }}
            onClick={() => setIsMenuOpen(false)}
            role="menuitem"
          >
            Get Started
          </a>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
