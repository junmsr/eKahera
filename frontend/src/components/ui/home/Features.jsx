import React from "react";
import { motion } from "framer-motion";

const features = [
  {
    icon: (
      <svg
        width="40"
        height="40"
        fill="none"
        stroke="#1976ed"
        strokeWidth="2.5"
        viewBox="0 0 24 24"
      >
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M16 3v4M8 3v4" />
        <path d="M3 11h18" />
      </svg>
    ),
    title: "Mobile-Friendly Self-Checkout",
    desc: "Customers can browse products, scan barcodes, add items to cart, and complete purchases via their smartphones.",
  },
  {
    icon: (
      <svg
        width="40"
        height="40"
        fill="none"
        stroke="#1976ed"
        strokeWidth="2.5"
        viewBox="0 0 24 24"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M7 7h.01M7 11h.01M7 15h.01M11 7h2v2h-2zM11 11h2v2h-2zM11 15h2v2h-2zM15 7h.01M15 11h.01M15 15h.01" />
      </svg>
    ),
    title: "QR Code Digital Receipts",
    desc: "Enhances transaction security and reduces fraud.",
  },
  {
    icon: (
      <svg
        width="40"
        height="40"
        fill="none"
        stroke="#1976ed"
        strokeWidth="2.5"
        viewBox="0 0 24 24"
      >
        <path d="M12 21c4.97 0 9-4.03 9-9s-4.03-9-9-9-9 4.03-9 9 4.03 9 9 9z" />
        <path d="M12 7v4l3 3" />
      </svg>
    ),
    title: "Payment Options",
    desc: "Supports both cash and online payments (GCash, Maya, etc.).",
  },
  {
    icon: (
      <svg
        width="40"
        height="40"
        fill="none"
        stroke="#1976ed"
        strokeWidth="2.5"
        viewBox="0 0 24 24"
      >
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 3v4M8 3v4" />
        <path d="M2 11h20" />
      </svg>
    ),
    title: "Transaction Processing",
    desc: "Cashiers scan customer-generated QR codes to verify and complete purchases.",
  },
  {
    icon: (
      <svg
        width="40"
        height="40"
        fill="none"
        stroke="#1976ed"
        strokeWidth="2.5"
        viewBox="0 0 24 24"
      >
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M16 3v4M8 3v4" />
        <path d="M3 11h18" />
      </svg>
    ),
    title: "Inventory Management",
    desc: "Customers can browse products, scan barcodes, add items to cart, and complete purchases via their smartphone.",
  },
  {
    icon: (
      <svg
        width="40"
        height="40"
        fill="none"
        stroke="#1976ed"
        strokeWidth="2.5"
        viewBox="0 0 24 24"
      >
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M16 3v4M8 3v4" />
        <path d="M3 11h18" />
      </svg>
    ),
    title: "Sales & Inventory Reports",
    desc: "Generates analytics and reports for better business decision making.",
  },
];

const Features = () => (
  <section
    id="features"
    className="hover:cursor-default relative w-full py-20 px-2 bg-white"
    style={{ fontFamily: "Inter, sans-serif" }}
  >
    <div className="max-w-6xl mx-auto">
      {/* Intro sentence */}
      <p className="hover:cursor-default text-blue-700 text-base md:text-lg text-center mb-2 font-medium">
        Discover what makes eKahera the smart choice for your business.
      </p>
      <h2 className="hover:cursor-default text-3xl md:text-4xl font-extrabold text-black mb-10 text-center">
        Features
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {features.map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: i * 0.04 }}
            className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center border border-blue-100 transition-all duration-300 hover:shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-center w-16 h-16 rounded-full bg-white group-hover:bg-white transition-colors duration-200">
              {f.icon}
            </div>
            <h3 className="font-extrabold text-lg text-black mb-2 text-center">
              {f.title}
            </h3>
            <p className="text-black text-center text-base">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default Features;
