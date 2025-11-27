import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageLayout from "../components/layout/PageLayout";
import HomeHero from "../components/ui/home/HomeHero";
import Features from "../components/ui/home/Features";
import AboutUs from "../components/ui/home/AboutUs";
import FAQ from "../components/ui/home/FAQ";
import SectionWrapper from "../components/ui/home/SectionWrapper";
// Removed vector image dividers
import SvgDivider from "../components/ui/home/SvgDivider";
import SkipLink from "../components/ui/home/SkipLink";

function Home() {
  const navigate = useNavigate();

  const handleCustomerPortal = () => navigate("/customer-enter");
  const handleStaffPortal = () => navigate("/login");
  const handleMobileScanner = () => navigate("/mobile-scanner");

  useEffect(() => {
    const doc = document.documentElement;
    const prevSmooth = doc.style.scrollBehavior;
    doc.style.scrollBehavior = "smooth";
    // offset for fixed navbar height
    doc.style.scrollPaddingTop = "64px";
    return () => {
      doc.style.scrollBehavior = prevSmooth || "";
      doc.style.scrollPaddingTop = "";
    };
  }, []);

  return (
    <PageLayout
      showNavbar={true}
      showFooter={true}
      showHeader={false}
      navbarVariant="default"
      footerVariant="default"
      className="overflow-x-hidden bg-white min-h-screen flex flex-col"
    >
      <SkipLink />

      {/* Hero Section */}
      <HomeHero
        onCustomerClick={handleCustomerPortal}
        onStaffClick={handleStaffPortal}
        onMobileScannerClick={handleMobileScanner}
      />
      <main id="main-content" role="main" className="flex-1">
        
        {/* Divider between Hero and Features */}
        {/* <SvgDivider className="my-8" /> */}

        {/* Features Section */}
        <SectionWrapper id="features" title="Key features">
          <Features />
        </SectionWrapper>

        {/* Divider between Features and About */}
        <SvgDivider className="my-8" />

        {/* About Us Section */}
        <SectionWrapper id="about" title="About us">
          <AboutUs />
        </SectionWrapper>

        {/* Divider between About and FAQ */}
        <SvgDivider className="my-8" />

        <SectionWrapper
          id="faq"
          title="Frequently asked questions"
          className="mb-8"
        >
          <FAQ />
        </SectionWrapper>
      </main>
      {/* Footer is provided by PageLayout when showFooter is true */}
    </PageLayout>
  );
}

export default Home;
