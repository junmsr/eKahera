import { Link } from "react-router-dom";
import Button from "./Button";
import "../index.css";
import MobileMenu from "./MobileMenu";
import menuBar from "../assets/images/menu-bar.png";
import { useEffect, useState } from "react";
import Logo from "./Logo";

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

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
    // <div className = "flex justify-center items-center">
    <nav
      id="main-navbar"
      className="items-center left-1/2 transform -translate-x-1/2 justify-between px-6 py-4 bg-gradient-to-r from-purple-600/80 via-purple-400/80 to-purple-300/80 backdrop-blur-md border border-purple-200/60 shadow-xl fixed top-3 left-0 w-full z-50 text-white"
    >
      {/* Logo */}
      <div className="flex items-center space-x-2">
        <Logo size={32} />
        <span className="text-xl font-semibold text-white drop-shadow">eKahera</span>
      </div>

      {/* Navigation Menu */}
      <div className="hidden md:flex items-center space-x-8">
        <Link
          to="/"
          className="hover:text-yellow-200 font-medium transition-colors"
        >
          Home
        </Link>
        <a
          href="#features"
          className="hover:text-yellow-200 font-medium transition-colors"
        >
          Features
        </a>
        <a
          href="#services"
          className="hover:text-yellow-200 font-medium transition-colors"
        >
          Services
        </a>
        <a
          href="#about"
          className="hover:text-yellow-200 font-medium transition-colors"
        >
          About Us
        </a>
        <a
          href="#contact"
          className="hover:text-yellow-200 font-medium transition-colors"
        >
          Contact
        </a>
      </div>
      {/* <img className="size-full cursor-pointer" src= {menuBar }alt="menu" /> */}

      <div className="hidden md:flex items-center space-x-4">
        <Link to="/get-started">
          <Button
            label="Get Started"
            className="bg-yellow-400 hover:bg-yellow-300 text-purple-900 px-6 py-2 rounded-full font-medium cursor-pointer shadow-md transition-colors"
          />
        </Link>
      </div>

      <div className="md:hidden" onClick={toggleMenu}>
        <Button className="md:hidden bg-transparent hover:bg-yellow-200 text-white px-2 py-2 font-medium transition-colors cursor-pointer border-opacity-5 rounded-xl border-2 border-white flex items-center">
          <img src={menuBar} alt="menu" />
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
        <div className="md:hidden absolute top-full left-70 w-50 bg-gradient-to-r from-purple-600/90 via-purple-400/90 to-purple-300/90 backdrop-blur-md border border-purple-200/60 shadow-xl z-50 flex flex-col items-start px-6 py-4 space-y-4 rounded-xl">
          <Link
            to="/"
            className="hover:text-yellow-200 font-medium w-full transition-colors"
            onClick={() => setIsMenuOpen(false)}
          >
            Home
          </Link>
          <a
            href="#features"
            className="hover:text-yellow-200 font-medium w-full transition-colors"
            onClick={() => setIsMenuOpen(false)}
          >
            Features
          </a>
          <a
            href="#services"
            className="hover:text-yellow-200 font-medium w-full transition-colors"
            onClick={() => setIsMenuOpen(false)}
          >
            Services
          </a>
          <a
            href="#about"
            className="hover:text-yellow-200 font-medium w-full transition-colors"
            onClick={() => setIsMenuOpen(false)}
          >
            About Us
          </a>
          <a
            href="#contact"
            className="hover:text-yellow-200 font-medium w-full transition-colors"
            onClick={() => setIsMenuOpen(false)}
          >
            Contact
          </a>
          <Link
            to="/get-started"
            className="w-full"
            onClick={() => setIsMenuOpen(false)}
          >
            <Button
              label="Get Started"
              className="bg-yellow-400 hover:bg-yellow-300 text-purple-900 px-6 py-2 rounded-full font-medium cursor-pointer w-full shadow-md transition-colors"
            />
          </Link>
        </div>
      )}
    </nav>
    // </div>
  );
}

export default Navbar;
