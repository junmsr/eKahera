import React from "react";
import { useLocation } from "react-router-dom";

function Navbar({ className = "" }) {
  const location = useLocation();
  const navItems = [
    { label: "Home", path: "/" },
    { label: "Features", path: "/#features" },
    { label: "Services", path: "/#services" },
    { label: "About Us", path: "/#about" },
  ];

  return (
    <nav
      className={`flex items-center justify-between px-4 py-2 bg-white border border-blue-100 shadow-xl rounded-full fixed top-4 left-1/2 transform -translate-x-1/2 w-[95vw] max-w-2xl z-50 ${className}`}
      style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
    >
      {/* Logo */}
      <div className="flex items-center space-x-1">
        <div className="bg-blue-600 rounded px-2 py-0.5 flex items-center justify-center">
          <span className="text-white font-bold text-base" style={{fontFamily: 'Inter, sans-serif'}}>eK</span>
        </div>
      </div>
      {/* Nav Links */}
      <div className="flex-1 flex items-center justify-center space-x-6">
        {navItems.map((item) => (
          <a
            key={item.label}
            href={item.path}
            className={`relative text-black hover:text-blue-600 transition-colors text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${location.hash === item.path ? "font-bold" : "font-medium"}`}
            style={{fontFamily: 'Inter, sans-serif'}}
          >
            {item.label}
            <span className="absolute left-0 -bottom-1 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full group-focus:w-full" />
          </a>
        ))}
      </div>
      {/* Register Button */}
      <div className="flex items-center">
        <a
          href="/get-started"
          className="bg-blue-600 text-white font-semibold px-5 py-1.5 rounded-full shadow hover:bg-blue-700 transition-all text-sm"
          style={{fontFamily: 'Inter, sans-serif'}}
        >
          Register
        </a>
      </div>
    </nav>
  );
}

export default Navbar;
