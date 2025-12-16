import React, { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";

function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api("/contact/submit", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      if (response.success) {
        setSubmitted(true);
      } else {
        setError(response.error || "Failed to send message. Please try again.");
      }
    } catch (err) {
      setError(err.message || "Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
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
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed text-white px-6 py-2 rounded-full font-medium cursor-pointer"
          >
            {loading ? "Sending..." : "Send Message"}
          </button>
        </form>
        <div className="mt-6 text-center text-gray-500 text-sm">
          Or email us at{" "}
          <a
            href="mailto:ekahera.business@gmail.com"
            className="text-blue-600 underline"
          >
            ekahera.business@gmail.com
          </a>
        </div>
      </div>
    </section>
  );
}

export default Contact;
