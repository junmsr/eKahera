import React from 'react';

function Footer() {
  return (
    <footer className="w-full bg-white shadow-inner py-6 mt-8">
      <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between">
        <span className="text-gray-600 text-sm text-center md:text-left">
          &copy; {new Date().getFullYear()} eKahera. All rights reserved.
        </span>
        <div className="flex space-x-4 mt-2 md:mt-0">
          <a href="#features" className="text-purple-600 hover:underline text-sm">Features</a>
          <a href="#about" className="text-purple-600 hover:underline text-sm">About Us</a>
          <a href="#contact" className="text-purple-600 hover:underline text-sm">Contact</a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;