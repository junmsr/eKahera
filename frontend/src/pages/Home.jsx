import React from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../components/layout/PageLayout';
import HomeHero from '../components/ui/home/HomeHero';
import SectionHeader from '../components/layout/SectionHeader';
import heroIllustration from '../assets/images/hero-illustration.png';
import BlueRadialBackground from "../components/layout/Background";

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
      <BlueRadialBackground />
      <HomeHero onCashierClick={handleCustomerPortal} onAdminClick={handleStaffPortal} />
    </PageLayout>
  );
}

export default Home;