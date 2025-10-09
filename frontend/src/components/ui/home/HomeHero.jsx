import React from "react";
import heroIllustration from "../../../assets/images/hero-illustration.png";
import { useNavigate } from "react-router-dom";
import { motion, useViewportScroll, useTransform } from "framer-motion";

function HomeHero({ onCustomerClick, onStaffClick }) {
  const navigate = useNavigate();
  const { scrollY } = useViewportScroll();
  // Subtle parallax for the illustration
  const parallaxY = useTransform(scrollY, [0, 300], [0, -20]);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
  };
  const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  // If parent didn't provide handlers, fall back to navigation
  const handleCustomer = onCustomerClick || (() => navigate("/customer"));
  const handleStaff = onStaffClick || (() => navigate("/select-role"));

  return (
    <section
      className="relative w-full min-h-[calc(100vh-48px)] md:min-h-[calc(100vh-64px)] flex flex-col items-center justify-start px-1 pt-1 md:pt-30 pb-0 overflow-hidden"
      style={{ fontFamily: "Inter, sans-serif", background: "#f9fafb" }}
    >
      {/* Animated background blobs */}
      <motion.div
        className="absolute -top-40 -left-40 w-[42rem] h-[42rem] rounded-full bg-gradient-to-br from-blue-500 via-blue-200 to-white opacity-60 blur-3xl z-0"
        initial={{ scale: 0.9, opacity: 0.4 }}
        animate={{ scale: [0.95, 1.05, 0.95], opacity: [0.4, 0.55, 0.4] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/2 -right-40 w-[36rem] h-[36rem] rounded-full bg-gradient-to-tr from-indigo-400 via-blue-200 to-white opacity-50 blur-3xl z-0"
        initial={{ scale: 1, opacity: 0.35 }}
        animate={{ scale: [1, 1.08, 1], opacity: [0.35, 0.5, 0.35] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 flex flex-col md:flex-row items-center justify-between w-full max-w-6xl mx-auto gap-6 md:gap-10 flex-1"
      >
        {/* Left Column: Heading and Button */}
        <motion.div
          className="flex-1 flex flex-col justify-center items-start h-full md:pr-8"
          variants={fadeUp}
        >
          {/* Badge/Tagline */}
          <motion.span variants={fadeUp} className="inline-block mb-3 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold tracking-wide shadow-sm">
            For Modern Businesses
          </motion.span>
          <motion.h1
            variants={fadeUp}
            className="text-4xl md:text-6xl font-extrabold text-black mb-4 leading-tight tracking-tight"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Smart Sales.
            <br />
            Simple Checkout.
          </motion.h1>
          <motion.div
            variants={fadeUp}
            className="text-gray-700 text-lg md:text-2xl mb-8 font-normal max-w-xl"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            A Smart POS for Every Business — Multi-Store, Multi-User, All in One
            Platform.
          </motion.div>
          <motion.div variants={fadeUp} className="flex flex-row gap-4 w-full md:w-auto">
            <button
              onClick={handleCustomer}
              className="bg-white text-blue-700 font-semibold px-7 py-3 rounded shadow border border-blue-200 hover:bg-blue-50 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 text-base flex items-center gap-2"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Customer
            </button>
            <button
              onClick={handleStaff}
              className="bg-gradient-to-r from-blue-600 to-blue-400 text-white font-semibold px-7 py-3 rounded shadow-lg hover:from-blue-700 hover:to-blue-500 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 text-base flex items-center gap-2"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Admin / Cashier
            </button>
          </motion.div>
        </motion.div>

        {/* Right Column: Hero Illustration with floating animation */}
        <motion.div
          className="flex-1 flex items-center justify-center h-full mt-8 md:mt-0"
          variants={fadeUp}
        >
          <motion.img
            src={heroIllustration}
            alt="Digital payment illustration"
            className="w-[18rem] md:w-[30rem] max-w-full drop-shadow-2xl will-change-transform"
            style={{ objectFit: "contain", y: parallaxY }}
            animate={{ y: [0, -16, 0], rotateZ: [0, 0.3, 0] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </motion.div>
    </section>
  );
}

export default HomeHero;
