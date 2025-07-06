import React from "react";

function MobileMenu({ isOpen, toggleMenu }) {
  return (
    <div
      className={`md:hidden transition-all duration-300 ease-in-out ${
        isOpen ? "max-h-96 opacity-100 mt-4" : "max-h-0 opacity-0 overflow-hidden"
      }`}
    >
      <ul className="flex flex-col items-center space-y-4 bg-white p-4 rounded-lg shadow-lg">
        <li>
          <a href="/" className="text-gray-700 hover:text-blue-500 font-medium">
            Home
          </a>
        </li>
        <li>
          <a href="/features" className="text-gray-700 hover:text-blue-500 font-medium">
            Features
          </a>
        </li>
        <li>
          <a href="#" className="text-gray-700 hover:text-blue-500 font-medium">
            Services
          </a>
        </li>
        <li>
          <a href="#" className="text-gray-700 hover:text-blue-500 font-medium">
            About Us
          </a>
        </li>
        <li>
          <a href="#" className="text-gray-700 hover:text-blue-500 font-medium">
            Contact
          </a>
        </li>
        <li>
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-full font-medium cursor-pointer">
            Get Started
          </button>
        </li>
      </ul>
    </div>
  );
}

export default MobileMenu;