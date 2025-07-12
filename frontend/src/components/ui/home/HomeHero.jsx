import React from 'react';
import heroIllustration from "../../../assets/images/hero-illustration.png";
import { CashierButton, AdminButton } from '../../common/Button';

function HomeHero({ onCashierClick, onAdminClick }) {
  return (
    <div className="relative z-10 flex flex-col md:flex-row items-center justify-center min-h-[80vh] px-4 py-12 overflow-x-hidden mt-20 gap-8 md:gap-30">
      {/* Left Column: Heading and Buttons */}
      <div className="flex-1 flex flex-col justify-center md:justify-center items-center md:items-end h-full">
        <div className="w-full md:max-w-xl flex flex-col items-center md:items-end">
          <h1 className="text-5xl md:text-6xl font-extrabold text-right mb-2 leading-tight tracking-tight drop-shadow-sm" style={{color: '#1769e0', textShadow: '0 4px 16px #bcd0ee'}}>Smart Sales.<span className="block" style={{color: '#1976ed'}}>Simple Checkout.</span></h1>
          {/* Tagline/Subheading */}
          <div className="text-right text-gray-700 text-lg md:text-xl mb-10 font-medium max-w-md">
            A Smart POS for Every Business — Multi-Store,<br />Multi-User, All in One Platform.
          </div>
          <div className="flex flex-row gap-15 w-full md:w-auto justify-end">
            <CashierButton onClick={onCashierClick} />
            <AdminButton onClick={onAdminClick} />
          </div>
        </div>
      </div>
      {/* Right Column: Hero Illustration */}
      <div className="flex-1 flex items-center justify-left h-full">
        <img
          src={heroIllustration}
          alt="Digital payment illustration"
          className="w-[28rem] md:w-[34rem] max-w-full drop-shadow-xl"
          style={{ objectFit: 'contain' }}
        />
      </div>
    </div>
  );
}

export default HomeHero; 