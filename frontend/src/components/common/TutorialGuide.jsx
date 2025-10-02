import React, { useState } from 'react';
import Button from './Button';

export default function TutorialGuide({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showTutorial, setShowTutorial] = useState(true);

  const tutorialSteps = [
    {
      title: "Welcome to eKahera!",
      content: "Let's take a quick tour of your new POS system. This tutorial will help you get started with the key features.",
      icon: "👋",
      action: "Get Started"
    },
    {
      title: "Dashboard Overview",
      content: "Your dashboard shows sales analytics, recent transactions, and key business metrics. This is your command center for monitoring business performance.",
      icon: "📊",
      action: "Next"
    },
    {
      title: "Inventory Management",
      content: "Add and manage your products here. You can set prices, track stock levels, and organize items by categories. Keep your inventory up-to-date for accurate sales tracking.",
      icon: "📦",
      action: "Next"
    },
    {
      title: "Point of Sale (POS)",
      content: "Process sales transactions quickly and efficiently. Scan barcodes, add items manually, apply discounts, and handle different payment methods.",
      icon: "💳",
      action: "Next"
    },
    {
      title: "Team Management",
      content: "Add cashiers and team members to your business. Assign roles and permissions to control access to different features of the system.",
      icon: "👥",
      action: "Next"
    },
    {
      title: "Reports & Analytics",
      content: "Track your business performance with detailed reports. Monitor sales trends, inventory levels, and generate insights to grow your business.",
      icon: "📈",
      action: "Next"
    },
    {
      title: "You're All Set!",
      content: "Congratulations! You're now ready to start using eKahera. Remember, you can always access help and support from the menu. Welcome aboard!",
      icon: "🚀",
      action: "Start Using eKahera"
    }
  ];

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    setShowTutorial(false);
    onComplete();
  };

  const handleComplete = () => {
    setShowTutorial(false);
    onComplete();
  };

  if (!showTutorial) {
    return null;
  }

  const currentStepData = tutorialSteps[currentStep];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">
              Step {currentStep + 1} of {tutorialSteps.length}
            </span>
            <button
              onClick={handleSkip}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Skip Tutorial
            </button>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((currentStep + 1) / tutorialSteps.length) * 100}%`
              }}
            ></div>
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">{currentStepData.icon}</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            {currentStepData.title}
          </h2>
          <p className="text-gray-600 leading-relaxed">
            {currentStepData.content}
          </p>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className={`px-4 py-2 text-sm rounded-md ${
              currentStep === 0
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            Previous
          </button>

          <div className="flex space-x-2">
            {tutorialSteps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentStep
                    ? 'bg-blue-600'
                    : index < currentStep
                    ? 'bg-blue-300'
                    : 'bg-gray-300'
                }`}
              ></div>
            ))}
          </div>

          <Button onClick={handleNext}>
            {currentStepData.action}
          </Button>
        </div>
      </div>
    </div>
  );
}
