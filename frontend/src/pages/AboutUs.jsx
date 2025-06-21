import React from 'react';

function AboutUs() {
  return (
    <section id="about" className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gray-50">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-purple-700 mb-4 text-center">About Us</h2>
        <p className="text-gray-700 text-lg mb-6 text-center">
          <strong>eKahera</strong> is dedicated to empowering MSMEs with modern, easy-to-use management tools.
          Our mission is to help small businesses thrive by providing a platform that simplifies store, inventory, and sales management.
        </p>
        <div className="mb-4">
          <h3 className="text-xl font-semibold text-purple-600 mb-2">Our Vision</h3>
          <p className="text-gray-600">
            To be the leading digital partner for MSMEs, enabling growth and sustainability through technology.
          </p>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-purple-600 mb-2">Our Team</h3>
          <p className="text-gray-600">
            We are a passionate group of developers, designers, and business experts committed to making business management accessible for everyone.
          </p>
        </div>
      </div>
    </section>
  );
}

export default AboutUs;