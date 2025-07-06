import React from 'react';
import { useNavigate } from 'react-router-dom';

// Components
import PageLayout from '../components/PageLayout';
import Card from '../components/Card';
import SectionHeader from '../components/SectionHeader';
import Button from '../components/Button';

/**
 * Home Page Component
 * Landing page with portal selection for customers and staff
 */
function Home() {
  const navigate = useNavigate();

  // Navigation handlers
  const handleCustomerPortal = () => navigate('/customer');
  const handleStaffPortal = () => navigate('/login');

  return (
    <PageLayout
      showNavbar={true}
      showFooter={true}
      showHeader={false}
      navbarVariant="default"
      footerVariant="default"
    >
      <div className="flex flex-col items-center justify-center min-h-screen relative">
        <div className="w-full max-w-xl mx-auto mt-24 z-10">
          <Card 
            variant="glass" 
            className="rounded-3xl p-10 shadow-2xl"
          >
            {/* Main Heading */}
            <SectionHeader 
              size="xl" 
              className="text-5xl md:text-6xl font-extrabold mb-4 leading-tight tracking-tight drop-shadow-sm text-center"
            >
              Smart Sales.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-purple-600 to-yellow-400">
                Simple Checkout.
              </span>
            </SectionHeader>

            {/* Subheading */}
            <SectionHeader
              variant="light"
              size="md"
              className="text-lg md:text-xl text-gray-700 mb-8 font-medium text-center !font-normal"
            >
              Choose your portal to continue.
            </SectionHeader>

            {/* Action Buttons */}
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <Button
                onClick={handleCustomerPortal}
                className="bg-gradient-to-r from-purple-500 to-purple-700 text-white px-8 py-3 rounded-full font-bold text-lg shadow-md hover:from-purple-600 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all hover:scale-105 active:scale-95"
                aria-label="Go to Customer Portal"
              >
                Customer
              </Button>
              
              <Button
                onClick={handleStaffPortal}
                className="bg-gradient-to-r from-purple-500 to-purple-700 text-white px-8 py-3 rounded-full font-bold text-lg shadow-md hover:from-purple-600 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all hover:scale-105 active:scale-95"
                aria-label="Go to Cashier/Admin Portal"
              >
                Cashier/Admin
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}

export default Home;