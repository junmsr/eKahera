import React from "react";
import heroIllustration from "../../../assets/images/hero-illustration.png";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";

function HomeHero({ onCustomerClick, onStaffClick }) {
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  // Subtle parallax for the illustration
  const parallaxY = useTransform(scrollY, [0, 300], [0, -20]);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 },
    },
  };
  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } 
    },
  };

  // If parent didn't provide handlers, fall back to navigation
  const handleCustomer = onCustomerClick || (() => navigate("/customer"));
  const handleStaff = onStaffClick || (() => navigate("/select-role"));

  return (
    <section
      className="relative w-full min-h-screen flex flex-col items-center justify-center px-4 md:px-6 lg:px-8 pt-24 md:pt-32 pb-16 md:pb-24 overflow-x-hidden"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {/* Animated gradient mesh background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50/30 to-purple-50/20" />
      
      {/* Multiple animated gradient orbs */}
      <motion.div
        className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-blue-400/40 to-cyan-400/30 blur-3xl z-0"
        animate={{
          x: [0, 100, 0],
          y: [0, 50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute top-1/3 -right-32 w-[600px] h-[600px] rounded-full bg-gradient-to-bl from-purple-400/35 to-pink-400/25 blur-3xl z-0"
        animate={{
          x: [0, -80, 0],
          y: [0, -60, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-indigo-400/30 to-blue-400/20 blur-3xl z-0"
        animate={{
          x: [0, 60, 0],
          y: [0, -40, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

      {/* Main content container */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 w-full max-w-[95rem] mx-auto"
      >
        <div className="relative flex flex-col lg:flex-row items-center lg:items-start justify-between gap-12 lg:gap-16 lg:pr-0">
          {/* Left Column: Heading and CTA */}
          <motion.div
            className="flex-1 flex flex-col justify-center items-start max-w-2xl lg:max-w-none lg:w-[55%] pt-8 lg:pt-12"
            variants={fadeUp}
          >
            {/* Glassmorphism Badge */}
            <motion.div
              variants={fadeUp}
              className="group relative mb-6"
            >
              <motion.span
                className="hover:cursor-default inline-flex items-center px-4 py-2 rounded-full backdrop-blur-md bg-white/70 border border-white/20 shadow-lg shadow-blue-500/10 text-blue-700 text-sm font-semibold tracking-wide"
              >
                <span className="relative flex h-2 w-2 mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                For Modern Businesses
              </motion.span>
            </motion.div>
            
            {/* Gradient Heading */}
            <motion.h1
              variants={fadeUp}
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[1.05] font-extrabold mb-6 md:mb-8 tracking-tight"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent hover:cursor-default">
                Smart POS for
              </span>
              <br />
              <span className="hover:cursor-default bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 bg-clip-text text-transparent">
                Every Business.
              </span>
            </motion.h1>
            
            {/* Description with better typography */}
            <motion.p
              variants={fadeUp}
              className="hover:cursor-default text-lg sm:text-xl md:text-2xl text-slate-600 mb-10 md:mb-12 font-normal leading-relaxed max-w-xl"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Streamline checkout, manage inventory, and track sales in real time
              with a secure, scalable POS built for growth.
            </motion.p>
            
            {/* Enhanced CTA Buttons */}
            <motion.div
              variants={fadeUp}
              className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
            >
              {/* Primary Button with gradient */}
              <div className="flex flex-col group">
                <motion.button
                  onClick={handleStaff}
                  className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold px-8 py-4 rounded-2xl shadow-xl shadow-blue-500/25 border border-blue-500/20 text-base sm:text-lg flex items-center justify-center min-w-[180px] transition-all duration-300"
                  style={{ fontFamily: "Inter, sans-serif" }}
                  whileHover={{ 
                    scale: 1.02,
                    boxShadow: "0 20px 25px -5px rgba(37, 99, 235, 0.3), 0 10px 10px -5px rgba(37, 99, 235, 0.2)"
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <span>Log In</span>
                    <motion.svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </motion.svg>
                  </span>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-800"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "0%" }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.button>
                <span className="hover:cursor-default text-xs sm:text-sm text-slate-500 mt-2.5 text-center sm:text-left font-medium">
                  Try the Admin/Cashier experience
                </span>
              </div>
              
              {/* Secondary Button with glassmorphism */}
              <div className="flex flex-col group">
                <motion.button
                  onClick={handleCustomer}
                  className="relative overflow-hidden backdrop-blur-md bg-white/80 border-2 border-blue-200/50 text-blue-700 font-semibold px-8 py-4 rounded-2xl shadow-lg shadow-blue-500/10 text-base sm:text-lg flex items-center justify-center gap-2 min-w-[180px] transition-all duration-300"
                  style={{ fontFamily: "Inter, sans-serif" }}
                  whileHover={{ 
                    scale: 1.02,
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    borderColor: "rgba(59, 130, 246, 0.6)",
                    boxShadow: "0 20px 25px -5px rgba(59, 130, 246, 0.15), 0 10px 10px -5px rgba(59, 130, 246, 0.1)"
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="relative z-10">Shop Now!</span>
                </motion.button>
                <span className="hover:cursor-default text-xs sm:text-sm text-slate-500 mt-2.5 text-center sm:text-left font-medium">
                  Shop in your own convenience
                </span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column: Hero Illustration with floating animation */}
          <motion.div
            className="flex-shrink-0 w-full sm:w-[85%] lg:w-[45%] flex items-center justify-center lg:justify-end h-full mt-4 lg:mt-0 relative lg:translate-x-8 xl:translate-x-12"
            variants={fadeUp}
          >
            <motion.img
              src={heroIllustration}
              alt="Digital payment illustration"
              className="w-full h-auto max-w-full lg:max-w-none drop-shadow-2xl will-change-transform"
              style={{ objectFit: "contain"}}
              animate={{ y: [0, -16, 0], rotateZ: [0, 0.3, 0] }}
              // transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}

export default HomeHero;
