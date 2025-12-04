import React from "react";
import SectionHeader from "../../layout/SectionHeader";
import { motion } from "framer-motion";

const AboutUs = () => (
  <section
    id="about"
    className="relative w-full py-28 bg-gradient-to-b from-white to-blue-50/30 flex justify-center items-center"
  >
    <motion.div
      className="max-w-6xl w-full mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 px-6"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
    >
      {/* LEFT SIDE CONTENT */}
      <div className="flex flex-col items-start">
        <SectionHeader size="2xl" align="left" className="mb-6 text-slate-900">
          About eKahera
        </SectionHeader>

        <p className="text-black text-lg md:text-xl font-medium mb-6 max-w-prose leading-relaxed">
          We build smart, reliable POS software designed to help small and
          midsize businesses sell faster, operate smarter, and scale with
          confidence.
        </p>

        <div className="grid grid-cols-1 gap-8 w-full">
          {/* MISSION */}
          <div className="flex items-start gap-4">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-md">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#2563EB"
                strokeWidth="2"
              >
                <path d="M12 2l3 7h7l-5.5 4 2.5 7-7-4.5L5 20l2.5-7L2 9h7z" />
              </svg>
            </span>
            <div>
              <h3 className="text-slate-900 font-semibold text-xl">
                Our Mission
              </h3>
              <p className="text-black text-base md:text-lg mt-2 leading-relaxed">
                Empower entrepreneurs through simple, fast, and intelligent POS
                tools that improve checkout, enhance insights, and support
                business growth.
              </p>
            </div>
          </div>

          {/* VISION */}
          <div className="flex items-start gap-4">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-md">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#2563EB"
                strokeWidth="2"
              >
                <path d="M3 12h18M12 3v18" />
              </svg>
            </span>
            <div>
              <h3 className="text-slate-900 font-semibold text-xl">
                Our Vision
              </h3>
              <p className="text-black text-base md:text-lg mt-2 leading-relaxed">
                A future where every store—from micro-kiosks to national
                chains—runs on simple, secure, and delightful POS technology.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE CARD */}
      <div className="flex md:justify-end">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative w-full max-w-lg p-8 rounded-3xl bg-white/80 backdrop-blur-xl border border-blue-100 shadow-[0_12px_45px_rgba(37,99,235,0.12)]"
        >
          <div
            className="absolute inset-0 rounded-3xl pointer-events-none"
            style={{ boxShadow: "inset 0 0 0 1.5px rgba(37,99,235,0.06)" }}
          />

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
              <span className="text-xs uppercase tracking-wider text-slate-700 font-semibold">
                Why eKahera
              </span>
            </div>

            <ul className="space-y-4 text-slate-800 text-base md:text-lg leading-relaxed">
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-blue-600" />
                Real-time sales and inventory monitoring
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-blue-600" />
                Multi-branch and multi-user capabilities
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-blue-600" />
                Cloud-first security and performance
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-blue-600" />
                Lightning-fast setup and intuitive UI
              </li>
            </ul>
          </div>
        </motion.div>
      </div>
    </motion.div>
  </section>
);

export default AboutUs;
