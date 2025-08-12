import React from 'react';
import SectionHeader from '../../layout/SectionHeader';

const AboutUs = () => (
  <section id="about" className="relative w-full py-24 bg-gray-50 flex justify-center items-center">
    <div className="max-w-2xl w-full mx-auto flex flex-col items-center px-4">
      <SectionHeader size="xl" align="center" className="mb-8 text-blue-900">About Us</SectionHeader>
      <p className="text-blue-900 text-lg mb-4 text-center font-medium max-w-3xl" style={{fontFamily: 'Inter, sans-serif', lineHeight: '1.7'}}>
        We’re a tech-driven company focused on helping small to medium-sized businesses streamline their sales with simple, smart, and scalable POS solutions.
      </p>
      <p className="text-blue-900 text-lg text-center font-medium max-w-3xl" style={{fontFamily: 'Inter, sans-serif', lineHeight: '1.7'}}>
        Our mission is to empower entrepreneurs with tools that are easy to use yet powerful in performance. Whether you’re running a kiosk, café, or retail shop, our platform makes checkout fast, inventory easy, and analytics insightful. With a team passionate about innovation and customer success, we’re redefining how businesses manage transactions—one smart checkout at a time.
      </p>
    </div>
  </section>
);

export default AboutUs; 