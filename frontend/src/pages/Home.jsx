import React from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../components/layout/PageLayout';
import HomeHero from '../components/ui/home/HomeHero';
import Features from '../components/ui/home/Features';
import AboutUs from '../components/ui/home/AboutUs';
import FAQ from '../components/ui/home/FAQ';
import vector1 from '../assets/images/vector1.png';
import vector2 from '../assets/images/vector2.png';

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
      backgroundVariant={undefined}
      className="overflow-x-hidden bg-white"
    >
      {/* Hero Section */}
      <HomeHero onCustomerClick={handleCustomerPortal} onStaffClick={handleStaffPortal} />

      {/* Divider: vector1 between Hero and Features (overlapping for seamless transition) */}
      <div style={{ position: 'relative', width: '100%', zIndex: 2, marginTop: '-5vw', marginBottom: '-2vw' }}>
        <img
          src={vector1}
          alt="divider"
          className="w-full h-auto object-cover pointer-events-none select-none drop-shadow-2xl"
          style={{ display: 'block', filter: 'drop-shadow(0 8px 24px rgba(37,99,235,0.12))' }}
        />
        {/* Fade-out gradient overlay */}
        <div style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: '40px',
          background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, #fff 100%)',
          pointerEvents: 'none',
        }} />
      </div>

      {/* Features Section */}
        <Features />

      {/* About Us Section */}
        <AboutUs />

      {/* Custom SVG divider between About Us and FAQ */}
      <div className="w-full flex items-center justify-center my-16">
        <svg width="320" height="16" viewBox="0 0 320 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <line x1="0" y1="8" x2="140" y2="8" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="8 8" />
          <circle cx="160" cy="8" r="6" fill="#2563eb" />
          <line x1="180" y1="8" x2="320" y2="8" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="8 8" />
        </svg>
      </div>

      {/* FAQ Section */}
        <FAQ />

      {/* Divider: vector2 between FAQ and Footer */}
      <img
        src={vector2}
        alt="divider"
        className="w-full h-auto object-cover"
        style={{ margin: 0, padding: 0 }}
      />
    </PageLayout>
  );
}

export default Home;