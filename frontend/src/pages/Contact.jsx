import React, { useState } from "react";
import { Link } from "react-router-dom";

function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you could add form validation or API call if needed
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <section
        id="contact"
        className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gray-50"
      >
        <div className="max-w-xl w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <h2 className="text-3xl font-bold text-green-700 mb-4">Thank You!</h2>
          <p className="text-gray-700 text-lg mb-6">
            Your concern has been submitted successfully. We will get back to
            you soon.
          </p>
          <Link
            to="/"
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-full font-medium cursor-pointer inline-block text-center"
          >
            Back to Homepage
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section
      id="contact"
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gray-50"
    >
      <div className="max-w-xl w-full bg-white rounded-xl shadow-lg p-8">
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to home
          </Link>
        </div>
        <h2 className="text-3xl font-bold text-blue-700 mb-4 text-center">
          Contact Us
        </h2>
        <p className="text-gray-700 text-lg mb-6 text-center">
          Have questions or need support? Reach out to the eKahera team!
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
          <input
            type="text"
            name="name"
            placeholder="Your Name"
            value={formData.name}
            onChange={handleChange}
            className="border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Your Email"
            value={formData.email}
            onChange={handleChange}
            className="border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
          <textarea
            name="message"
            placeholder="Your Message"
            value={formData.message}
            onChange={handleChange}
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
          Or email us at{" "}
          <a
            href="mailto:support@ekahera.com"
            className="text-blue-600 underline"
          >
            support@ekahera.com
          </a>
        </div>
      </div>
    </section>
  );
}

export default Contact;
