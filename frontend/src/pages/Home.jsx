import React from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../components/layout/PageLayout';
import Button from '../components/common/Button';
import SectionHeader from '../components/layout/SectionHeader';
import heroIllustration from '../assets/images/hero-illustration.png';

function Home() {
  const navigate = useNavigate();

  // Navigation handlers
  const handleCustomerPortal = () => navigate('/pos');
  const handleStaffPortal = () => navigate('/login');

  return (
    <PageLayout
      showNavbar={true}
      showFooter={true}
      showHeader={false}
      navbarVariant="default"
      footerVariant="default"
    >
      {/* Blue radial background with subtle dotted grid */}
      <div className="fixed inset-0 z-0 pointer-events-none select-none" style={{
        background: `radial-gradient(circle at 50% 30%, rgba(59,130,246,0.13) 0%, transparent 80%), url('data:image/svg+xml;utf8,<svg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'><circle cx=\'1\' cy=\'1\' r=\'1\' fill=\'%23bcd0ee\' fill-opacity=\'0.25\'/></svg>') repeat`}}
      />
      {/* Main Content: Centered, no card */}
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
              <Button
                onClick={handleCustomerPortal}
                className="bg-white border-2 border-blue-400 text-blue-600 font-semibold rounded-full py-3 px-10 text-lg shadow-sm hover:bg-blue-50 transition-colors min-w-[160px]"
                aria-label="Go to Customer Portal"
              >
                Cashier
              </Button>
              <Button
                onClick={handleStaffPortal}
                className="bg-blue-400 text-white font-semibold rounded-full py-3 px-10 text-lg shadow-sm hover:bg-blue-500 transition-colors min-w-[160px]"
                aria-label="Go to Cashier/Admin Portal"
              >
                Admin
              </Button>
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
    </PageLayout>
  );
}

export default Home;