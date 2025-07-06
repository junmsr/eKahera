import React from 'react';
import '../index.css';

function Services () {
  return (
    <section id="services">
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <h1 className="text-4xl font-bold text-blue-600 mb-6">Our Services</h1>
        <p className="text-lg text-gray-700 mb-4">
            We offer a wide range of services to help you achieve your goals.
        </p>
        <ul className="list-disc list-inside text-gray-600">
            <li>Service 1: Description of service 1</li>
            <li>Service 2: Description of service 2</li>
            <li>Service 3: Description of service 3</li>
        </ul>
        </div>
    </section>

  );
}

export default Services;