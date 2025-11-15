import React from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/common/Button";
import Logo from "../assets/images/Logo.png";

function NotFound() {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <div className="mb-8">
          <img src={Logo} alt="eKahera Logo" className="mx-auto w-24 h-24" />
        </div>

        {/* 404 Illustration/Icon */}
        <div className="mb-8">
          <div className="relative">
            <div className="text-9xl font-bold text-blue-200 select-none">
              404
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                className="w-24 h-24 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-.978-5.708-2.709M12 2l3 3-3 3-3-3 3-3z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Content */}
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Page Not Found
        </h1>
        <p className="text-lg text-gray-600 mb-8 leading-relaxed">
          Oops! The page you're looking for doesn't exist. It might have been
          moved, deleted, or you entered the wrong URL.
        </p>

        {/* Action Button */}
        <Button
          onClick={handleGoHome}
          variant="primary"
          size="lg"
          className="shadow-lg hover:shadow-xl"
        >
          Go Back Home
        </Button>

        {/* Additional Help */}
        <div className="mt-8 text-sm text-gray-500">
          <p>
            If you believe this is an error, please contact eKahera support.
          </p>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
