import React, { useState } from "react";
import SectionHeader from "../../layout/SectionHeader";
import { motion, AnimatePresence } from "framer-motion";

const faqs = [
  {
    q: "What devices is this POS software compatible with?",
    a: "Our POS works on any modern browser, desktop, laptop, or tablet. No special hardware required.",
  },
  {
    q: "Can I use this for multiple stores or branches?",
    a: "Yes! You can manage multiple stores and users from a single account.",
  },
  {
    q: "Is my data secure?",
    a: "Absolutely. We use industry-standard encryption and best practices to keep your data safe.",
  },
  {
    q: "How do I get support?",
    a: "You can reach us via the Help Center, email, or chat. We are here to help you succeed.",
  },
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(0);
  const toggle = (idx) => setOpenIndex((prev) => (prev === idx ? -1 : idx));
  return (
    <section className="relative w-full py-28 bg-white flex justify-center items-center">
      <motion.div
        className="max-w-4xl w-full mx-auto flex flex-col items-center px-6"
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <SectionHeader size="xl" align="center" className="mb-9 text-slate-900">
          Frequently Asked Questions
        </SectionHeader>
        <div className="w-full rounded-2xl bg-white border border-blue-100 shadow-[0_10px_40px_rgba(37,99,235,0.05)] divide-y divide-slate-100">
          {faqs.map((item, idx) => {
            const isOpen = idx === openIndex;
            return (
              <div key={item.q} className="group">
                <button
                  onClick={() => toggle(idx)}
                  className="w-full flex items-center justify-between gap-5 px-6 md:px-7 py-6 text-left hover:bg-white/40 transition-colors"
                  aria-expanded={isOpen}
                >
                  <span className="text-slate-900 font-normal text-lg md:text-xl">
                    {item.q}
                  </span>
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-blue-200 text-blue-600 bg-white group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    {isOpen ? (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M5 12h14" />
                      </svg>
                    ) : (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    )}
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                    >
                      <div className="px-6 md:px-7 pb-6 text-slate-700 md:text-lg text-base leading-relaxed">
                        {item.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </motion.div>
    </section>
  );
};

export default FAQ;
