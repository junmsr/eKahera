import React, { useState } from "react";
import TermsModal from "../modals/TermsModal";
import PrivacyPolicyModal from "../modals/PrivacyPolicyModal";

function Footer({ className = "" }) {
  const [openTerms, setOpenTerms] = useState(false);
  const [openPrivacy, setOpenPrivacy] = useState(false);
  return (
    <footer
      className={`relative w-full bg-white pt-0 ${className}`}
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-start">
          {/* Left: Brand and tagline */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 shadow-md flex items-center justify-center">
                <span className="text-white font-extrabold text-sm">eK</span>
              </div>
              <span className="text-2xl font-extrabold text-slate-900">eKahera</span>
            </div>
            <p className="text-slate-700 text-base leading-relaxed max-w-md">
              Smart POS platform for fast checkout, unified inventory, and real-time analytics.
            </p>
            <ul className="text-base text-slate-800 space-y-3">
              <li className="flex items-start gap-3 leading-relaxed">
                <svg width="20" height="20" fill="none" stroke="#2563eb" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" /><circle cx="12" cy="9" r="2.5" /></svg>
                <span>200, T. De Castro Street, Zone-8 Bulan, Sorsogon</span>
              </li>
              <li className="flex items-center gap-3 leading-relaxed">
                <svg width="20" height="20" fill="none" stroke="#2563eb" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 6l-10 7L2 6" /></svg>
                <a href="mailto:support@ekahera.com" className="text-slate-700 hover:text-blue-700 hover:underline underline-offset-2 transition-colors">support@ekahera.com</a>
              </li>
              <li className="flex items-center gap-3 leading-relaxed">
                <svg width="20" height="20" fill="none" stroke="#2563eb" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M8 6h8M8 10h8M8 14h6" /></svg>
                <span>+63 970 846 8324</span>
              </li>
            </ul>
            {/* Social icons */}
            <div className="flex items-center gap-3 pt-2">
              <a href="#" aria-label="Facebook" className="h-9 w-9 rounded-full border border-blue-100 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white active:scale-95 transition">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.5 9.9v-7h-2v-3h2v-2.3c0-2 1.2-3.1 3-3.1.9 0 1.8.16 1.8.16v2h-1c-1 0-1.3.63-1.3 1.3V12h2.3l-.37 3h-1.93v7A10 10 0 0 0 22 12z"/></svg>
              </a>
              <a href="#" aria-label="LinkedIn" className="h-9 w-9 rounded-full border border-blue-100 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white active:scale-95 transition">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6.94 6.5a1.94 1.94 0 1 1 0-3.88 1.94 1.94 0 0 1 0 3.88zM3.5 8.25h6.9V21H3.5zM13.12 8.25H20V21h-3.4v-6.2c0-1.48-.53-2.5-1.86-2.5-1.02 0-1.63.69-1.9 1.35-.1.25-.12.6-.12.95V21h-3.4s.05-10.5 0-12.75h3.4v1.8c.45-.69 1.25-1.66 3.04-1.66 2.22 0 3.86 1.45 3.86 4.56V21h0z"/></svg>
              </a>
              <a href="#" aria-label="Twitter" className="h-9 w-9 rounded-full border border-blue-100 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white active:scale-95 transition">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M22 5.92a7.57 7.57 0 0 1-2.18.6 3.79 3.79 0 0 0 1.66-2.1 7.6 7.6 0 0 1-2.4.92A3.78 3.78 0 0 0 12 8.3a10.74 10.74 0 0 1-7.8-3.96 3.78 3.78 0 0 0 1.17 5.04 3.76 3.76 0 0 1-1.71-.47v.05c0 1.82 1.3 3.34 3.02 3.68-.32.1-.66.15-1 .15-.25 0-.49-.02-.72-.07.49 1.54 1.9 2.66 3.58 2.69A7.58 7.58 0 0 1 3 18.58 10.7 10.7 0 0 0 8.8 20c6.54 0 10.12-5.42 10.12-10.12 0-.15 0-.3-.01-.45A7.23 7.23 0 0 0 22 5.92z"/></svg>
              </a>
            </div>
          </div>
          {/* Right: Links */}
          <div className="grid grid-cols-2 gap-10 md:justify-end md:pl-4">
            <div>
              <h3 className="font-semibold text-slate-900 mb-3 text-base">Company</h3>
              <ul className="space-y-2 text-base">
                <li><a href="#about" className="text-slate-700 hover:text-blue-700 hover:underline underline-offset-4 active:opacity-80 transition-colors">About Us</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-3 text-base">Support</h3>
              <ul className="space-y-2 text-base">
                <li><a href="#" className="text-slate-700 hover:text-blue-700 hover:underline underline-offset-4 active:opacity-80 transition-colors">Documentation</a></li>
                <li>
                  <button onClick={() => setOpenPrivacy(true)} className="text-left text-slate-700 hover:text-blue-700 hover:underline underline-offset-4 active:opacity-80 transition-colors">
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button onClick={() => setOpenTerms(true)} className="text-left text-slate-700 hover:text-blue-700 hover:underline underline-offset-4 active:opacity-80 transition-colors">
                    Terms and Conditions
                  </button>
                </li>
              </ul>
            </div>
          </div>
          
        </div>
        {/* Divider */}
        <div className="w-full h-px mt-10 mb-5 bg-gradient-to-r from-blue-100 via-blue-200 to-transparent" />
        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-2 mt-2 pb-2 text-sm text-slate-600">
          <span className="text-slate-600">&copy; {new Date().getFullYear()} eKahera. All rights reserved.</span>
          <span className="text-slate-500 text-center md:text-right">Professional POS solutions for modern retail.</span>
        </div>
      </div>
      <TermsModal open={openTerms} onClose={() => setOpenTerms(false)} />
      <PrivacyPolicyModal open={openPrivacy} onClose={() => setOpenPrivacy(false)} />
    </footer>
  );
}

export default Footer;
