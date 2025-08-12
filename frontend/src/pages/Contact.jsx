import React from 'react';

function Contact() {
  return (
    <section id="contact" className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gray-50">
      <div className="max-w-xl w-full bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-blue-700 mb-4 text-center">Contact Us</h2>
        <p className="text-gray-700 text-lg mb-6 text-center">
          Have questions or need support? Reach out to the eKahera team!
        </p>
        <form className="flex flex-col space-y-4">
          <input
            type="text"
            placeholder="Your Name"
            className="border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
          <input
            type="email"
            placeholder="Your Email"
            className="border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
          <textarea
            placeholder="Your Message"
            className="border border-gray-300 rounded px-4 py-2 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-full font-medium cursor-pointer"
          >
            Send Message
          </button>
        </form>
        <div className="mt-6 text-center text-gray-500 text-sm">
          Or email us at <a href="mailto:support@ekahera.com" className="text-blue-600 underline">support@ekahera.com</a>
        </div>
      </div>
    </section>
  );
}

export default Contact;