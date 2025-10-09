import React, { useState } from 'react';
import SectionHeader from '../../layout/SectionHeader';
import { motion, AnimatePresence } from 'framer-motion';

const faqs = [
  {
    q: 'What devices is this POS software compatible with?',
    a: 'Our POS works on any modern browser, desktop, laptop, or tablet. No special hardware required.'
  },
  {
    q: 'Can I use this for multiple stores or branches?',
    a: 'Yes! You can manage multiple stores and users from a single account.'
  },
  {
    q: 'Is my data secure?',
    a: 'Absolutely. We use industry-standard encryption and best practices to keep your data safe.'
  },
  {
    q: 'How do I get support?',
    a: 'You can reach us via the Help Center, email, or chat. We are here to help you succeed.'
  },
];

const FAQ = () => {
  const [openFaq, setOpenFaq] = useState(0);
  return (
    <section className="relative w-full py-24 bg-gray-50 flex justify-center items-center">
      <motion.div
        className="max-w-2xl w-full mx-auto flex flex-col items-center px-4"
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <SectionHeader size="xl" align="center" className="mb-8 text-blue-900">FAQs</SectionHeader>
        <div className="flex flex-col items-center w-full">
          <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-2xl flex flex-col items-center mb-4">
            <div className="flex w-full items-center justify-between mb-4">
              <button
                className="p-2 rounded-full hover:bg-blue-50 transition disabled:opacity-40"
                onClick={() => setOpenFaq(openFaq > 0 ? openFaq - 1 : faqs.length - 1)}
                aria-label="Previous question"
                disabled={faqs.length <= 1}
              >
                <svg className="w-6 h-6" fill="none" stroke="#1976ed" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <span className="flex-1 text-lg md:text-xl font-bold text-blue-900 text-center px-2">
                {faqs[openFaq].q}
              </span>
              <button
                className="p-2 rounded-full hover:bg-blue-50 transition disabled:opacity-40"
                onClick={() => setOpenFaq(openFaq < faqs.length - 1 ? openFaq + 1 : 0)}
                aria-label="Next question"
                disabled={faqs.length <= 1}
              >
                <svg className="w-6 h-6" fill="none" stroke="#1976ed" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={openFaq}
                className="w-full bg-white rounded-xl p-6 text-blue-900 text-lg text-center font-medium"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
              >
                {faqs[openFaq].a}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default FAQ; 