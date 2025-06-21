import { Link } from 'react-router-dom';
import Button from './Button';
import '../index.css'
import MobileMenu from './MobileMenu';
import menuBar from '../assets/images/menu-bar.png';
import { useEffect, useState } from 'react';


function Navbar() {

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  useEffect(() => {
    const nav = document.getElementById('main-navbar');
    const handleScroll = () => {
      if (window.scrollY > 10) {
        nav.classList.add('navbar-scrolled');
      } else {
        nav.classList.remove('navbar-scrolled');
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    // <div className = "flex justify-center items-center">
      <nav id="main-navbar" className="items-center left-1/2 transform -translate-x-1/2 justify-between px-6 py-4 bg-white shadow-lg fixed top-3 left-0 w-full z-50">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-purple-500 rounded flex items-center justify-center">
            <span className="text-white font-bold text-sm">eK</span>
          </div>
          <span className="text-xl font-semibold text-gray-800">eKahera</span>
        </div>

        {/* Navigation Menu */}
        <div className="hidden md:flex items-center space-x-8">
          <a href="#home" className="text-gray-700 hover:text-purple-500 font-medium">
            Home
          </a>
          <a href="#features" className="text-gray-700 hover:text-purple-500 font-medium">
            Features
          </a>
          <a href="#services" className="text-gray-700 hover:text-purple-500 font-medium">
            Services
          </a>
          <a href="#about" className="text-gray-700 hover:text-purple-500 font-medium">
            About Us
          </a>
          <a href="#contact" className="text-gray-700 hover:text-purple-500 font-medium">
            Contact
          </a>
        </div>
        {/* <img className="size-full cursor-pointer" src= {menuBar }alt="menu" /> */}

        <div className="hidden md:flex items-center space-x-4">
          <Button label="Get Started" className = "bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-full font-medium cursor-pointer"/>
        </div>
        
        <div className = "md:hidden" onClick={toggleMenu}>
          <Button className ="md:hidden bg-white-500 hover:bg-purple-600 text-white px-2 py-2 font-medium transition-colors cursor-pointer border-opacity-5 rounded-xl border-2 border-purple-500 flex items-center">
            <img src={menuBar} alt="menu"/>
          </Button>
        </div>

        {/* <div>
          <button className="md:hidden w-6 h-6 cursor-pointer" onClick={toggleMenu} aria-label="Toggle menu">
            <img src={menuBar || "/placeholder.svg"} alt="menu" className="w-full h-full object-contain" />
          </button>
        </div> */}
        {/* Sign Up Buttons */}
        {/* <div className="flex items-center space-x-3">
          <Button className ="text-purple-500 hover:text-purple-600 font-medium bg cursor-pointer">SIGN UP</Button>
          <Button className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-full font-medium cursor-pointer">SIGN UP</Button>
        </div> */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-70 w-50 bg-white shadow-lg z-50 flex flex-col items-start px-6 py-4 space-y-4 rounded-xl">
            <a href="#home" className="text-gray-700 hover:text-purple-500 font-medium w-full" onClick={() => setIsMenuOpen(false)}>
              Home
            </a>
            <a href="#features" className="text-gray-700 hover:text-purple-500 font-medium w-full" onClick={() => setIsMenuOpen(false)}>
              Features
            </a>
            <a href="#services" className="text-gray-700 hover:text-purple-500 font-medium w-full" onClick={() => setIsMenuOpen(false)}>
              Services
            </a>
            <a href="#about" className="text-gray-700 hover:text-purple-500 font-medium w-full" onClick={() => setIsMenuOpen(false)}>
              About Us
            </a>
            <a href="#contact" className="text-gray-700 hover:text-purple-500 font-medium w-full" onClick={() => setIsMenuOpen(false)}>
              Contact
            </a>
            <Button
              className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-full font-medium cursor-pointer w-full"
              onClick={() => setIsMenuOpen(false)}
            >
              Get Started
            </Button>
          </div>
        )}
      </nav>
    // </div>
  )
}

export default Navbar