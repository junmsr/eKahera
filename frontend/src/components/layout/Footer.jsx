import React, { useState } from "react";
import TermsModal from "../modals/TermsModal";
import PrivacyPolicyModal from "../modals/PrivacyPolicyModal";
import Logo from "../common/Logo";

function Footer({ className = "" }) {
  const [openTerms, setOpenTerms] = useState(false);
  const [openPrivacy, setOpenPrivacy] = useState(false);

  const footerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <footer
      className={`relative w-full pt-0 overflow-hidden ${className}`}
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {/* Enhanced gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-50/80 to-blue-50/40" />

      {/* Animated background orbs with better positioning */}
      <motion.div
        className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-gradient-to-br from-blue-400/15 to-cyan-400/10 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.4, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-gradient-to-bl from-purple-400/15 to-pink-400/10 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.3, 0.4, 0.3],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.02)_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-40" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-24 pb-16">
        <div
          variants={footerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-16 mb-16"
        >
          {/* Brand Column */}
          <div variants={itemVariants} className="lg:col-span-1">
            <div
              className="mb-8"
              whileHover={{ scale: 1.03 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Logo size={45} className="text-2xl" />
            </div>
            <p className="text-slate-600 text-sm leading-relaxed mb-8 max-w-xs font-medium">
              Smart POS platform for fast checkout, unified inventory, and
              real-time analytics.
            </p>

            {/* Contact Info with enhanced styling */}
            <div className="space-y-4 mb-8">
              <a
                href="mailto:support@ekahera.com"
                className="flex items-center gap-3 text-sm text-slate-700 hover:text-blue-600 transition-all duration-300 group"
                whileHover={{ x: 6, scale: 1.02 }}
              >
                <div
                  className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 group-hover:from-blue-100 group-hover:to-blue-200 flex items-center justify-center transition-all duration-300 shadow-sm group-hover:shadow-md"
                  whileHover={{ rotate: 5 }}
                >
                  <svg
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    className="text-blue-600"
                  >
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="M22 6l-10 7L2 6" />
                  </svg>
                </div>
                <span className="font-medium">support@ekahera.com</span>
              </motion.a>

              <motion.a
                href="tel:+639708468324"
                className="flex items-center gap-3 text-sm text-slate-700 hover:text-blue-600 transition-all duration-300 group"
                whileHover={{ x: 6, scale: 1.02 }}
              >
                <motion.div
                  className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 group-hover:from-blue-100 group-hover:to-blue-200 flex items-center justify-center transition-all duration-300 shadow-sm group-hover:shadow-md"
                  whileHover={{ rotate: 5 }}
                >
                  <svg
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    className="text-blue-600"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                </motion.div>
                <span className="font-medium">+63 970 846 8324</span>
              </motion.a>

              <motion.a
                href="https://www.google.com/maps/search/?api=1&query=200+T.+De+Castro+Street,+Zone-8+Bulan,+Sorsogon"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm text-slate-700 hover:text-blue-600 transition-all duration-300 group"
                whileHover={{ x: 6, scale: 1.02 }}
              >
                <motion.div
                  className="h-10 w-10 min-w-[2.5rem] rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 group-hover:from-blue-100 group-hover:to-blue-200 flex items-center justify-center transition-all duration-300 shadow-sm group-hover:shadow-md"
                  whileHover={{ rotate: 5 }}
                >
                  <svg
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    className="text-blue-600"
                  >
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                    <circle cx="12" cy="9" r="2.5" />
                  </svg>
                </motion.div>
                <span className="font-medium text-left">
                  200, T. De Castro Street, Zone-8 Bulan, Sorsogon
                </span>
              </motion.a>
            </div>

            {/* Enhanced Social Icons */}
            <div className="flex items-center gap-3">
              {[
                {
                  name: "Facebook",
                  icon: "M22 12a10 10 0 1 0-11.5 9.9v-7h-2v-3h2v-2.3c0-2 1.2-3.1 3-3.1.9 0 1.8.16 1.8.16v2h-1c-1 0-1.3.63-1.3 1.3V12h2.3l-.37 3h-1.93v7A10 10 0 0 0 22 12z",
                  color: "from-blue-500 to-blue-600",
                },
                {
                  name: "LinkedIn",
                  icon: "M6.94 6.5a1.94 1.94 0 1 1 0-3.88 1.94 1.94 0 0 1 0 3.88zM3.5 8.25h6.9V21H3.5zM13.12 8.25H20V21h-3.4v-6.2c0-1.48-.53-2.5-1.86-2.5-1.02 0-1.63.69-1.9 1.35-.1.25-.12.6-.12.95V21h-3.4s.05-10.5 0-12.75h3.4v1.8c.45-.69 1.25-1.66 3.04-1.66 2.22 0 3.86 1.45 3.86 4.56V21h0z",
                  color: "from-blue-600 to-blue-700",
                },
                {
                  name: "Twitter",
                  icon: "M22 5.92a7.57 7.57 0 0 1-2.18.6 3.79 3.79 0 0 0 1.66-2.1 7.6 7.6 0 0 1-2.4.92A3.78 3.78 0 0 0 12 8.3a10.74 10.74 0 0 1-7.8-3.96 3.78 3.78 0 0 0 1.17 5.04 3.76 3.76 0 0 1-1.71-.47v.05c0 1.82 1.3 3.34 3.02 3.68-.32.1-.66.15-1 .15-.25 0-.49-.02-.72-.07.49 1.54 1.9 2.66 3.58 2.69A7.58 7.58 0 0 1 3 18.58 10.7 10.7 0 0 0 8.8 20c6.54 0 10.12-5.42 10.12-10.12 0-.15 0-.3-.01-.45A7.23 7.23 0 0 0 22 5.92z",
                  color: "from-sky-500 to-blue-500",
                },
              ].map((social) => (
                <a
                  key={social.name}
                  href="#"
                  aria-label={social.name}
                  className="relative h-11 w-11 rounded-xl backdrop-blur-sm bg-white/90 border border-slate-200/80 text-slate-600 flex items-center justify-center overflow-hidden group transition-all duration-300 shadow-sm hover:shadow-lg"
                  whileHover={{ scale: 1.1, y: -3, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${social.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                  />
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="relative z-10 group-hover:text-white transition-colors duration-300"
                  >
                    <path d={social.icon} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Company Column */}
          <div variants={itemVariants}>
            <h3 className="font-bold text-slate-900 mb-7 text-base tracking-tight relative inline-block">
              Company
              <span
                className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-blue-500"
                whileHover={{ width: "100%" }}
                transition={{ duration: 0.3 }}
              />
            </h3>
            <ul className="space-y-3.5">
              {[
                {
                  name: "About Us",
                  href: "#about",
                  icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
                },
                {
                  name: "Features",
                  href: "#features",
                  icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
                },
                {
                  name: "Contact",
                  href: "/contact",
                  icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
                },
              ].map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="group flex items-center gap-2.5 text-sm text-slate-600 hover:text-blue-600 transition-all duration-300"
                    whileHover={{ x: 6 }}
                  >
                    <svg
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      className="text-slate-400 group-hover:text-blue-600 transition-colors duration-300"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d={link.icon}
                      />
                    </svg>
                    <span className="font-medium">{link.name}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Column */}
          <div variants={itemVariants}>
            <h3 className="font-bold text-slate-900 mb-7 text-base tracking-tight relative inline-block">
              Support
              <span
                className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-blue-500"
                whileHover={{ width: "100%" }}
                transition={{ duration: 0.3 }}
              />
            </h3>
            <ul className="space-y-3.5">
              <li>
                <a
                  href="#"
                  className="group flex items-center gap-2.5 text-sm text-slate-600 hover:text-blue-600 transition-all duration-300"
                  whileHover={{ x: 6 }}
                >
                  <svg
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    className="text-slate-400 group-hover:text-blue-600 transition-colors duration-300"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                  <span className="font-medium">Documentation</span>
                </a>
              </li>
              <li>
                <button
                  onClick={() => setOpenPrivacy(true)}
                  className="group flex items-center gap-2.5 text-left text-sm text-slate-600 hover:text-blue-600 transition-all duration-300 w-full"
                  whileHover={{ x: 6 }}
                >
                  <svg
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    className="text-slate-400 group-hover:text-blue-600 transition-colors duration-300"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  <span className="font-medium">Privacy Policy</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setOpenTerms(true)}
                  className="group flex items-center gap-2.5 text-left text-sm text-slate-600 hover:text-blue-600 transition-all duration-300 w-full"
                  whileHover={{ x: 6 }}
                >
                  <svg
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    className="text-slate-400 group-hover:text-blue-600 transition-colors duration-300"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span className="font-medium">Terms and Conditions</span>
                </button>
              </li>
              <li>
                <a
                  href="#faq"
                  className="group flex items-center gap-2.5 text-sm text-slate-600 hover:text-blue-600 transition-all duration-300"
                  whileHover={{ x: 6 }}
                >
                  <svg
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    className="text-slate-400 group-hover:text-blue-600 transition-colors duration-300"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="font-medium">FAQ</span>
                </a>
              </li>
            </ul>
          </motion.div>
        </motion.div>

        {/* Enhanced Divider */}
        <div
          className="relative w-full mb-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
          <div
            className="absolute top-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-blue-400/50 to-transparent"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          />
        </div>

        {/* Enhanced Bottom Bar */}
        <div
          className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-6 text-sm"
          variants={itemVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <span className="text-slate-600 font-medium">
            &copy; {new Date().getFullYear()} eKahera. All rights reserved.
          </span>
          <span className="hidden md:block text-slate-300 text-lg">•</span>
          <span className="text-slate-500 font-medium">
            Professional POS solutions for modern retail.
          </span>
        </motion.div>
      </div>
      <TermsModal open={openTerms} onClose={() => setOpenTerms(false)} />
      <PrivacyPolicyModal
        open={openPrivacy}
        onClose={() => setOpenPrivacy(false)}
      />
    </footer>
  );
}

export default Footer;
