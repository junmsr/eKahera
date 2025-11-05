import React from "react";

function Stepper({ steps, currentStep }) {
  const renderOutlinedIcon = (idx) => {
    switch (idx) {
      case 0: // user
        return (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        );
      case 1: // lock
        return (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        );
      case 2: // building
        return (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="7" height="18" />
            <rect x="14" y="8" width="7" height="13" />
            <path d="M7 6h2M7 10h2M7 14h2M18 11h2M18 15h2" />
          </svg>
        );
      case 3: // document
      default:
        return (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
            <path d="M16 13H8M16 17H8M10 9H8" />
          </svg>
        );
    }
  };
  return (
    <div className="mb-6">
      <div className="relative flex items-center justify-between">
        {steps.map((stepObj, idx) => (
          <div key={idx} className="flex flex-col items-center flex-1">
            <div
              className={`w-10 h-10 flex items-center justify-center rounded-full border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white z-10
                ${
                  idx < currentStep
                    ? "border-green-600 text-green-600"
                    : idx === currentStep
                    ? "border-blue-600 text-blue-600 ring-2 ring-blue-200"
                    : "border-gray-300 text-gray-400"
                }
              `}
              aria-current={idx === currentStep ? "step" : undefined}
              tabIndex={0}
              title={stepObj.label}
            >
              {renderOutlinedIcon(idx)}
            </div>
            <span
              className={`mt-2 text-xs font-medium text-center max-w-[90px] ${
                idx <= currentStep ? "text-blue-700" : "text-gray-500"
              }`}
            >
              {stepObj.label}
            </span>
          </div>
        ))}
        {/* Track */}
        <div
          className="absolute left-0 right-0 top-5 h-1 bg-gray-200 rounded"
          aria-hidden
        ></div>
        {/* Active bar */}
        <div
          className="absolute left-0 top-5 h-1 bg-gradient-to-r from-blue-600 to-blue-400 rounded transition-all duration-500"
          style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
          aria-hidden
        ></div>
      </div>
    </div>
  );
}

export default Stepper;
