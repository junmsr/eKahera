import React from 'react';
import SectionHeader from '../../layout/SectionHeader';
import { motion } from 'framer-motion';

const AboutUs = () => (
  <section id="about" className="relative w-full py-24 bg-white flex justify-center items-center">
    <motion.div
      className="max-w-5xl w-full mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 px-4"
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="flex flex-col items-start">
        <SectionHeader size="xl" align="left" className="mb-5 text-slate-900">About eKahera</SectionHeader>
        <p className="text-slate-700 text-lg md:text-xl font-medium mb-5 max-w-prose" style={{fontFamily: 'Inter, sans-serif', lineHeight: 1.75}}>
          We build smart, reliable POS software that helps small and midsize businesses move faster.
        </p>
        <div className="grid grid-cols-1 gap-6 w-full">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shadow-sm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2"><path d="M12 2l3 7h7l-5.5 4 2.5 7-7-4.5L5 20l2.5-7L2 9h7z"/></svg>
            </span>
            <div>
              <h3 className="text-slate-900 font-semibold text-lg">Our Mission</h3>
              <p className="text-slate-700 text-base md:text-lg mt-1" style={{lineHeight: 1.75}}>
                Empower entrepreneurs with tools that simplify checkout, unlock insights, and scale with their growth.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shadow-sm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2"><path d="M3 12h18M12 3v18"/></svg>
            </span>
            <div>
              <h3 className="text-slate-900 font-semibold text-lg">Our Vision</h3>
              <p className="text-slate-700 text-base md:text-lg mt-1" style={{lineHeight: 1.75}}>
                A future where every store—kiosk to chain—runs on simple, secure, and delightful POS technology.
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex md:justify-end">
        <div className="relative w-full max-w-lg p-7 rounded-2xl bg-white/70 backdrop-blur border border-blue-100 shadow-[0_10px_40px_rgba(37,99,235,0.08)]">
          <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{boxShadow: 'inset 0 0 0 1px rgba(37,99,235,0.08)'}} />
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-500"/>
              <span className="text-xs uppercase tracking-wide text-slate-500">Why eKahera</span>
            </div>
            <ul className="space-y-3 text-slate-800 text-base md:text-lg">
              <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-600"/>Real-time sales and stock tracking</li>
              <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-600"/>Multi-store and multi-user support</li>
              <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-600"/>Secure, cloud-first architecture</li>
              <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-600"/>Fast setup, intuitive UI</li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  </section>
);

export default AboutUs; 