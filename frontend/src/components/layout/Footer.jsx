import React from 'react';

function Footer({ className = "" }) {
  return (
    <footer className={`relative w-full bg-white pt-0 ${className}`} style={{fontFamily: 'Inter, sans-serif'}}>
      <div className="relative z-10 max-w-5xl mx-auto px-4 pt-16 pb-2">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-12 md:gap-0">
          {/* Left: Logo and Info */}
          <div className="flex-1 min-w-[260px] mb-8 md:mb-0">
            <div className="flex items-center space-x-2 mb-4">
              <div className="bg-blue-600 rounded-lg px-3 py-1 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-2xl" style={{fontFamily: 'Inter, sans-serif'}}>eK</span>
              </div>
              <span className="text-2xl font-extrabold text-blue-700 drop-shadow-sm" style={{fontFamily: 'Inter, sans-serif'}}>ahera</span>
            </div>
            <p className="text-black mb-4 max-w-xs text-sm font-medium">
              Smart sales management system that simplifies checkout processes and enhances customer experience with modern technology.
            </p>
            <ul className="text-sm text-black space-y-3 mb-2">
              <li className="flex items-start gap-3"><svg width="22" height="22" fill="none" stroke="#2563eb" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg><span><span className="font-bold">200, T. De Castro Street</span><br/>Zone-8 Bulan, Sorsogon</span></li>
              <li className="flex items-center gap-3"><svg width="22" height="22" fill="none" stroke="#2563eb" strokeWidth="2.2" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6l-10 7L2 6"/></svg><span>eKahera-POS@gmail.com</span></li>
              <li className="flex items-center gap-3"><svg width="22" height="22" fill="none" stroke="#2563eb" strokeWidth="2.2" viewBox="0 0 24 24"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 10h8M8 14h6"/></svg><span>+63 970 846 8324</span></li>
            </ul>
          </div>
          {/* Columns */}
          <div className="flex flex-1 flex-row justify-end gap-16">
            <div>
              <h3 className="font-semibold text-blue-700 mb-3 text-base">Company</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#contact" className="text-black hover:text-blue-700 transition-colors">Contact Us</a></li>
                <li><a href="#" className="text-black hover:text-blue-700 transition-colors">Careers</a></li>
                <li><a href="#" className="text-black hover:text-blue-700 transition-colors">Our Company</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-blue-700 mb-3 text-base">Support</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-black hover:text-blue-700 transition-colors">Help Center</a></li>
                <li><a href="#" className="text-black hover:text-blue-700 transition-colors">Documentation</a></li>
                <li><a href="#" className="text-black hover:text-blue-700 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-black hover:text-blue-700 transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
        </div>
        {/* Blue horizontal line */}
        <div className="w-full h-1 mt-10 mb-2" style={{background: 'linear-gradient(90deg, #e8f0fe 0%, #2563eb 100%)', opacity: 0.3}} />
        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-2 mt-2 pb-2 text-xs text-gray-700">
          <div className="flex items-center gap-2">
            <span>&copy; {new Date().getFullYear()} eKahera. All rights reserved.</span>
            <span className="hidden md:inline-block mx-2 text-gray-400">|</span>
            <span>Made with <span className="text-red-500">❤️</span> for better sales.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;