import React from 'react';
import { Link } from 'react-router-dom';

// Components
import Logo from './Logo';

/**
 * Footer Component
 * Site footer with links, social media, and company information
 */
function Footer({ 
  variant = "default",
  showSocial = true,
  className = ""
}) {
  // Footer sections
  const footerSections = [
    {
      title: "Product",
      links: [
        { label: "Features", path: "/features" },
        { label: "Services", path: "/services" },
        { label: "Pricing", path: "/pricing" },
        { label: "Get Started", path: "/get-started" }
      ]
    },
    {
      title: "Company",
      links: [
        { label: "About Us", path: "/about" },
        { label: "Contact", path: "/contact" },
        { label: "Careers", path: "/careers" },
        { label: "Blog", path: "/blog" }
      ]
    },
    {
      title: "Support",
      links: [
        { label: "Help Center", path: "/help" },
        { label: "Documentation", path: "/docs" },
        { label: "Privacy Policy", path: "/privacy" },
        { label: "Terms of Service", path: "/terms" }
      ]
    }
  ];

  // Social media links
  const socialLinks = [
    { label: "Facebook", icon: "📘", url: "#" },
    { label: "Twitter", icon: "🐦", url: "#" },
    { label: "Instagram", icon: "📷", url: "#" },
    { label: "LinkedIn", icon: "💼", url: "#" }
  ];

  // Base styles
  const baseStyles = "w-full border-t shadow-inner py-8 mt-8";
  
  // Variant styles
  const variantStyles = {
    default: "bg-gradient-to-t from-white to-blue-50 border-blue-100",
    dark: "bg-blue-900 text-white border-blue-800",
    minimal: "bg-white border-gray-200"
  };

  // Combine styles
  const combinedStyles = `${baseStyles} ${variantStyles[variant]} ${className}`;

  return (
    <footer className={combinedStyles}>
      <div className="max-w-7xl mx-auto px-6">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <Logo size={32} />
              <span className="text-xl font-semibold text-blue-700">
                eKahera
              </span>
            </div>
            <p className="text-gray-600 mb-4 max-w-md">
              Smart sales management system that simplifies checkout processes 
              and enhances customer experience with modern technology.
            </p>
            {showSocial && (
              <div className="flex space-x-4">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.url}
                    className="text-gray-500 hover:text-blue-600 transition-colors"
                    aria-label={social.label}
                  >
                    <span className="text-xl">{social.icon}</span>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Footer Links */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="font-semibold text-blue-700 mb-4">
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.path}
                      className="text-gray-600 hover:text-blue-600 transition-colors text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-blue-200 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-gray-600 text-sm text-center md:text-left">
            &copy; {new Date().getFullYear()} eKahera. All rights reserved.
          </div>
          
          <div className="flex items-center space-x-6 text-sm">
            <Link to="/privacy" className="text-gray-600 hover:text-blue-600 transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-gray-600 hover:text-blue-600 transition-colors">
              Terms of Service
            </Link>
            <span className="text-gray-400">|</span>
            <span className="text-gray-500">
              Made with ❤️ for better sales
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;