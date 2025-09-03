import React from "react";
import heroIllustration from "../../../assets/images/hero-illustration.png";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

function HomeHero({ onCustomerClick, onStaffClick }) {
  const navigate = useNavigate();

  // If parent didn't provide handlers, fall back to navigation
  const handleCustomer = onCustomerClick || (() => navigate("/customer"));
  const handleStaff = onStaffClick || (() => navigate("/select-role"));

  return (
    <section
      className="relative w-full min-h-screen flex flex-col items-center justify-center px-4 py-0 overflow-hidden"
      style={{ fontFamily: "Inter, sans-serif", background: "#fff" }}
    >
      {/* Subtle background gradient shape */}
      <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-blue-100 via-blue-50 to-white opacity-60 blur-2xl z-0" />
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between w-full max-w-6xl mx-auto gap-0 md:gap-8 flex-1">
        {/* Left Column: Heading and Button */}
        <motion.div
          className="flex-1 flex flex-col justify-center items-start h-full md:pr-8"
          initial={{ opacity: 0, x: -60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Badge/Tagline */}
          <span className="inline-block mb-3 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold tracking-wide shadow-sm">
            For Modern Businesses
          </span>
          <h1
            className="text-4xl md:text-6xl font-extrabold text-black mb-4 leading-tight tracking-tight"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Smart Sales.
            <br />
            Simple Checkout.
          </h1>
          <div
            className="text-gray-700 text-lg md:text-2xl mb-8 font-normal max-w-xl"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            A Smart POS for Every Business — Multi-Store, Multi-User, All in One
            Platform.
          </div>
          <div className="flex flex-row gap-4 w-full md:w-auto">
            <button
              onClick={handleCustomer}
              className="bg-white text-blue-700 font-semibold px-7 py-3 rounded shadow border border-blue-200 hover:bg-blue-50 hover:scale-105 active:scale-95 transition-all duration-200 text-base flex items-center gap-2"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Customer
            </button>
            <button
              onClick={handleStaff}
              className="bg-gradient-to-r from-blue-600 to-blue-400 text-white font-semibold px-7 py-3 rounded shadow-lg hover:from-blue-700 hover:to-blue-500 hover:scale-105 active:scale-95 transition-all duration-200 text-base flex items-center gap-2"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Admin / Cashier
            </button>
          </div>
        </motion.div>

        {/* Right Column: Hero Illustration with floating animation */}
        <motion.div
          className="flex-1 flex items-center justify-center h-full mt-8 md:mt-0"
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        >
          <motion.img
            src={heroIllustration}
            alt="Digital payment illustration"
            className="w-[18rem] md:w-[28rem] max-w-full drop-shadow-xl"
            style={{ objectFit: "contain" }}
            animate={{ y: [0, -16, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </div>
    </section>
  );
}

export default HomeHero;
