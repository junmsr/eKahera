import React from "react";
import { motion } from "framer-motion";

const SectionHeader = ({ size, align, className, children }) => (
  <h2 className={`text-${size} text-${align} ${className}`}>{children}</h2>
);

const AboutUs = () => (
  <section
    id="about"
    className="relative w-full py-20 md:py-32 bg-gradient-to-b from-white via-blue-50/20 to-white flex justify-center items-center overflow-hidden"
  >
    {/* Decorative background elements */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
    </div>

    <motion.div
      className="max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 px-6 relative z-10"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
    >
      {/* LEFT SIDE CONTENT */}
      <div className="flex flex-col items-start">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold mb-6 border border-blue-100">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
            Powering Modern Commerce
          </span>
          <SectionHeader
            size="2xl"
            align="left"
            className="mb-6 text-slate-900 text-4xl font-bold"
          >
            About eKahera
          </SectionHeader>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-slate-700 text-lg md:text-xl font-normal mb-10 max-w-prose leading-relaxed"
        >
          We build smart, cloud-based POS software designed to help micro, small, 
          and midsize businesses sell faster, operate smarter, and scale with 
          confidence through real-time management.
        </motion.p>

        <div className="grid grid-cols-1 gap-6 w-full">
          {/* MISSION */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="group flex items-start gap-4 p-6 rounded-2xl bg-gradient-to-br from-blue-50/50 to-transparent border border-blue-100/50 transition-all duration-300"
          >
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 transition-all duration-300">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 2l3 7h7l-5.5 4 2.5 7-7-4.5L5 20l2.5-7L2 9h7z" />
              </svg>
            </span>
            <div className="flex-1">
              <h3 className="text-slate-900 font-bold text-xl mb-2">
                Our Mission
              </h3>
              <p className="text-slate-600 text-base md:text-lg leading-relaxed">
                To deliver a simple, web-based platform that empowers Albay businesses 
                with real-time store management and innovative self-scanning checkout 
                to drive quick growth and customer delight.
              </p>
            </div>
          </motion.div>

          {/* VISION */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="group flex items-start gap-4 p-6 rounded-2xl bg-gradient-to-br from-indigo-50/50 to-transparent border border-indigo-100/50 transition-all duration-300"
          >
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/30 transition-all duration-300">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </span>
            <div className="flex-1">
              <h3 className="text-slate-900 font-bold text-xl mb-2">
                Our Vision
              </h3>
              <p className="text-slate-600 text-base md:text-lg leading-relaxed">
                To be the digital backbone for every MSME in Albay, setting the 
                standard for modern, efficient, and self-service retail.
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* RIGHT SIDE CARD */}
      <div className="flex lg:justify-end">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
          className="relative w-full max-w-lg"
        >
          {/* Background glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-3xl blur-2xl opacity-40" />

          <div className="relative p-8 md:p-10 rounded-3xl bg-white/90 backdrop-blur-xl border border-blue-100/80 shadow-[0_20px_70px_rgba(37,99,235,0.15)] transition-all duration-500">
            <div className="absolute inset-0 rounded-3xl pointer-events-none bg-gradient-to-br from-blue-50/50 to-transparent" />

            <div className="relative flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 animate-pulse" />
                <span className="text-xs uppercase tracking-widest text-slate-600 font-bold">
                  Why eKahera
                </span>
              </div>

              <ul className="space-y-5 text-slate-700">
                {[
                  {
                    text: "Real-time sales and inventory monitoring",
                    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
                  },
                  {
                    text: "Multi-branch and multi-user capabilities",
                    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
                  },
                  {
                    text: "Cloud-first security and performance",
                    icon: "M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z",
                  },
                  {
                    text: "Lightning-fast setup and intuitive UI",
                    icon: "M13 10V3L4 14h7v7l9-11h-7z",
                  },
                ].map((item, idx) => (
                  <motion.li
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.5 + idx * 0.1 }}
                    className="flex items-start gap-4 group"
                  >
                    <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md transition-all duration-300">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d={item.icon} />
                      </svg>
                    </span>
                    <span className="flex-1 text-base md:text-lg leading-relaxed font-medium transition-colors">
                      {item.text}
                    </span>
                  </motion.li>
                ))}
              </ul>

              {/* Optional CTA */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.9 }}
                className="mt-4 pt-6 border-t border-slate-200"
              ></motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  </section>
);

export default AboutUs;
