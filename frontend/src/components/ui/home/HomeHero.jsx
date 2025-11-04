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
      className="relative w-full min-h-[calc(100vh-56px)] md:min-h-[calc(100vh-72px)] flex flex-col items-center justify-center px-1 md:px-8 pt-24 md:pt-40 pb-2 overflow-hidden bg-white"
      style={{ fontFamily: "Inter, sans-serif", background: "#ffffff" }}
    >
      {/* Animated background blobs */}
      <motion.div
        className="absolute -top-40 -left-40 w-[42rem] h-[42rem] rounded-full bg-white opacity-30 blur-3xl z-0"
        initial={{ scale: 0.9, opacity: 0.25 }}
        animate={{ scale: [0.95, 1.05, 0.95], opacity: [0.25, 0.4, 0.25] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/2 -right-40 w-[36rem] h-[36rem] rounded-full bg-white opacity-22 blur-3xl z-0"
        initial={{ scale: 1, opacity: 0.22 }}
        animate={{ scale: [1, 1.06, 1], opacity: [0.22, 0.34, 0.22] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 flex flex-col-reverse md:flex-row items-center justify-center w-full max-w-full px-4 md:px-8 mx-auto gap-10 md:gap-12 flex-1"
      >
        {/* Left Column: Heading and Button */}
        <motion.div
          className="flex-1 flex-col justify-center items-start h-full md:pr-10"
          variants={fadeUp}
        >
          {/* Badge/Tagline */}
          <motion.span
            variants={fadeUp}
            className="inline-block mb-3 px-3 py-1 rounded-full bg-white text-blue-700 text-xs font-semibold tracking-wide shadow-sm border border-blue-100"
          >
            For Modern Businesses
          </motion.span>
          <motion.h1
            variants={fadeUp}
            className="text-[40px] leading-[1.05] md:text-7xl md:leading-[1.03] font-extrabold text-slate-900 mb-10 tracking-tight"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Smart POS for Every Business.
          </motion.h1>
          <motion.div
            variants={fadeUp}
            className="text-black text-xl md:text-2xl mb-10 font-normal max-w-2xl"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Streamline checkout, manage inventory, and track sales in real time
            with a secure, scalable POS built for growth.
          </motion.div>
          <motion.div
            variants={fadeUp}
            className="flex flex-col sm:flex-row gap-4 sm:gap-5 w-full md:w-auto"
          >
            <div className="flex flex-col">
              <button
                onClick={handleStaff}
                className="bg-blue-700 text-white font-semibold px-8 py-3.5 rounded-xl shadow-md border border-blue-600 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 text-lg flex items-center"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Log In
              </button>
              <span className="text-sm text-black mt-1">
                Try the Admin/Cashier experience
              </span>
            </div>
            <div className="flex flex-col">
              <button
                onClick={handleCustomer}
                className="bg-white text-blue-700 font-semibold px-8 py-3.5 rounded-xl shadow border border-blue-200 hover:bg-blue-50 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 text-lg flex items-center gap-2"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Explore as Customer
              </button>
              <span className="text-sm text-black mt-1">
                See the shopping flow
              </span>
            </div>
          </motion.div>
        </motion.div>

        {/* Right Column: Hero Illustration with floating animation */}
        <motion.div
          className="flex-2 flex items-center justify-center md:justify-end h-full mt-4 md:mt-0 relative"
          variants={fadeUp}
        >
          <motion.img
            src={heroIllustration}
            alt="Digital payment illustration"
            /* scale image responsively using viewport widths so it never overflows the screen */
            className="w-[100rem] md:w-[100vw] lg:w-[40vw] max-w-full drop-shadow-2xl will-change-transform"
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
