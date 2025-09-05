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
    { label: "Features", path: "/#features" },
    { label: "Services", path: "/#services" },
    { label: "About Us", path: "/#about" },
    { label: "Contact", path: "/#contact" },
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
      className={`flex items-center justify-between px-4 py-2 bg-white border border-blue-100 shadow-xl rounded-full fixed top-4 left-1/2 transform -translate-x-1/2 w-[95vw] max-w-2xl z-50 ${className}`}
      style={{ fontFamily: "Inter, sans-serif", fontWeight: 500 }}
    >
      {/* Ensure only the centralized Logo is shown in the header */}
      <style>{`
        /* Hide other header images (duplicate logos) but keep the nav logo visible */
        header img:not(.nav-logo) { display: none !important; }
      `}</style>

      {/* Logo */}
      <div className="flex items-center space-x-1">
        <Link to="/" aria-label="eKahera home" className="flex items-center">
          {/* Use centralized Logo component and mark it as the nav logo */}
          <Logo className="nav-logo h-8 w-auto" />
        </Link>
      </div>

      {/* Desktop Navigation Menu */}
      <div className="hidden md:flex flex-1 items-center justify-center space-x-6">
        {navItems.map((item) => (
          <a
            key={item.label}
            href={item.path}
            className={`relative text-black hover:text-blue-600 transition-colors text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
              location.hash === item.path ? "font-bold" : "font-medium"
            }`}
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            {item.label}
            <span className="absolute left-0 -bottom-1 w-0 h-0.5 bg-blue-600 transition-all duration-300 hover:w-full" />
          </a>
        ))}
      </div>

      {/* Desktop Get Started Button */}
      <div className="hidden md:flex items-center">
        <a
          href="/get-started"
          className="bg-blue-600 text-white font-semibold px-5 py-1.5 rounded-full shadow hover:bg-blue-700 transition-all text-sm"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          Get Started
        </a>
      </div>

      {/* Mobile Menu Button */}
      <div className="md:hidden" onClick={toggleMenu}>
        <Button className="md:hidden bg-white hover:bg-blue-50 text-gray-800 px-2 py-2 font-medium transition-colors cursor-pointer border-opacity-20 rounded-xl border-2 border-blue-600 flex items-center">
          <img src={menuBar} alt="menu" className="w-5 h-5" />
        </Button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-1/2 transform -translate-x-1/2 w-[90vw] max-w-xs bg-white shadow-lg z-50 flex flex-col items-start px-6 py-4 space-y-4 rounded-xl border border-blue-100 mt-2">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.path}
              className="text-gray-700 hover:text-blue-600 font-medium w-full transition-colors"
              style={{ fontFamily: "Inter, sans-serif" }}
              onClick={() => setIsMenuOpen(false)}
            >
              {item.label}
            </a>
          ))}
          <a
            href="/get-started"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-medium cursor-pointer w-full text-center transition-colors"
            style={{ fontFamily: "Inter, sans-serif" }}
            onClick={() => setIsMenuOpen(false)}
          >
            Get Started
          </a>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
