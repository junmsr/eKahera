import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageLayout from "../components/layout/PageLayout";
import HomeHero from "../components/ui/home/HomeHero";
import Features from "../components/ui/home/Features";
import AboutUs from "../components/ui/home/AboutUs";
import FAQ from "../components/ui/home/FAQ";
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
    const doc = document.documentElement;
    const prevSmooth = doc.style.scrollBehavior;
    doc.style.scrollBehavior = "smooth";

    const header = document.querySelector("header");
    if (header) {
      doc.style.scrollPaddingTop = `${header.offsetHeight}px`;
    }

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
      backgroundVariant={undefined}
      className="overflow-x-hidden bg-white"
    >
      {/* Hero Section */}
      <HomeHero
        onCustomerClick={handleCustomerPortal}
        onStaffClick={handleStaffPortal}
      />

      <main id="main-content" role="main" className="min-h-screen">
        <HomeHero
          onCustomerClick={handleCustomerPortal}
          onStaffClick={handleStaffPortal}
          onMobileScannerClick={handleMobileScanner}
        />

        <ImageDivider src={vector1} overlay className="drop-shadow-2xl" />

        <SectionWrapper id="features" title="Key features">
          <Features />
        </SectionWrapper>

        <SectionWrapper id="about" title="About us">
          <AboutUs />
        </SectionWrapper>

        <SvgDivider />

        <SectionWrapper
          id="faq"
          title="Frequently asked questions"
          className="mb-8"
        >
          <FAQ />
        </SectionWrapper>

        <ImageDivider src={vector2} overlay={false} />
      </main>
    </PageLayout>
  );
}

export default Home;
