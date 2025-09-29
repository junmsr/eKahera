import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageLayout from "../components/layout/PageLayout";
import Navbar from "../components/layout/Navbar";
import HomeHero from "../components/ui/home/HomeHero";
import Features from "../components/ui/home/Features";
import AboutUs from "../components/ui/home/AboutUs";
import FAQ from "../components/ui/home/FAQ";
import Footer from "../components/layout/Footer";
import vector1 from "../assets/images/vector1.png";
import vector2 from "../assets/images/vector2.png";
import SectionWrapper from "../components/ui/home/SectionWrapper";
import ImageDivider from "../components/ui/home/ImageDivider";
import SvgDivider from "../components/ui/home/SvgDivider";
import SkipLink from "../components/ui/home/SkipLink";

function Home() {
  const navigate = useNavigate();

  const handleCustomerPortal = () => navigate("/customer");
  const handleStaffPortal = () => navigate("/login");
  const handleMobileScanner = () => navigate("/mobile-scanner");

  useEffect(() => {
    // Setup smooth scrolling and header offset
    const doc = document.documentElement;
    const prevSmooth = doc.style.scrollBehavior;
    doc.style.scrollBehavior = "smooth";

    const header = document.querySelector("header");
    if (header) {
      doc.style.scrollPaddingTop = `${header.offsetHeight}px`;
    }

    // Cleanup function
    return () => {
      doc.style.scrollBehavior = prevSmooth || "";
      doc.style.scrollPaddingTop = "";
    };
  }, []);

  return (
    <PageLayout
      showNavbar={true}
      showFooter={true}
      showHeader={true}
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
        {/* Features Section with Vector Divider */}
        <ImageDivider src={vector1} overlay className="drop-shadow-2xl" />
        <SectionWrapper id="features" title="Key features">
          <Features />
        </SectionWrapper>

        {/* About Us Section */}
        <SectionWrapper id="about" title="About us">
          <AboutUs />
        </SectionWrapper>

        {/* FAQ Section with Dividers */}
        <SvgDivider />
        <SectionWrapper
          id="faq"
          title="Frequently asked questions"
          className="mb-8"
        >
          <FAQ />
        </SectionWrapper>

        {/* Bottom Vector Divider */}
        <ImageDivider src={vector2} overlay={false} />
      </main>

      <Footer />
    </PageLayout>
  );
}

export default Home;
