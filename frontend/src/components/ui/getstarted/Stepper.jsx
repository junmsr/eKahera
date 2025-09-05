import React from "react";

function Stepper({ steps, currentStep }) {
  return (
    <div className="flex items-center justify-center mb-10 gap-2 md:gap-4">
      {steps.map((stepObj, idx) => (
        <React.Fragment key={idx}>
          <div
            className={`w-10 h-10 flex items-center justify-center rounded-full border-2 font-bold text-lg transition-all duration-300 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 
              ${
                idx < currentStep
                  ? "bg-green-500 border-green-500 text-white"
                  : idx === currentStep
                  ? "bg-blue-600 border-blue-700 text-white ring-2 ring-blue-300"
                  : "bg-blue-100 border-gray-300 text-gray-400"
              }
            `}
            aria-current={idx === currentStep ? "step" : undefined}
            tabIndex={0}
          >
            {stepObj.icon}
          </div>
          {idx < steps.length - 1 && (
            <div className="w-8 h-1 bg-gray-300 mx-1 rounded hidden md:block" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export default Stepper;
