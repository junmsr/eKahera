import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import Button from './Button';
import Loader from './Loader';
import TutorialGuide from './TutorialGuide';

import { useAuth } from '../../hooks/useAuth';

export default function VerificationStatus({ user, onProceed }) {
  const [verificationData, setVerificationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialCompleted, setTutorialCompleted] = useState(false);
  const { logout } = useAuth();

  useEffect(() => {
    if (user) {
      fetchVerificationStatus();
    }

    const tutorialStatus = localStorage.getItem(`tutorial_completed_${user?.user_id}`);
    setTutorialCompleted(tutorialStatus === 'true');
  }, [user]);

  const fetchVerificationStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const data = await api(
        `/documents/business/${user.businessId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        }
      );
      setVerificationData(data);
      console.log('Verification data:', data); // Added for debugging
    } catch (err) {
      if (err.message === 'jwt expired' || err.message === '{\"error\":\"Invalid token\"}') {
        logout();
      } else {
        setError(err.message || 'Failed to fetch verification status');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader size="lg" />
          <p className="mt-4 text-gray-600">Checking verification status...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const { verification } = verificationData;
  const status = verification?.verification_status || 'not_submitted';

  // If approved, show congratulatory message with confetti effect
  if (status === 'approved') {
    return (
      <>
        {/* Confetti Effect */}
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className={`absolute animate-pulse`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                fontSize: `${Math.random() * 20 + 20}px`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${Math.random() * 3 + 2}s`
              }}
            >
              {['🎉', '🎊', '✨', '🌟', '💫', '🎈'][Math.floor(Math.random() * 6)]}
            </div>
          ))}
        </div>
        
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 relative">
          <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8 text-center relative z-10">
            <div className="text-6xl mb-6 animate-bounce">🎉</div>
            <h1 className="text-3xl font-bold text-green-600 mb-4 animate-pulse">
              Congratulations!
            </h1>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Your Business Has Been Verified!
            </h2>
            <p className="text-gray-600 mb-6">
              Welcome to eKahera! Your business documents have been reviewed and approved. 
              You now have full access to all system features.
            </p>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-green-800 mb-2">🚀 What's Next?</h3>
              <ul className="text-sm text-green-700 text-left space-y-1">
                <li>• 📦 Set up your product inventory</li>
                <li>• 💻 Configure your POS system</li>
                <li>• 👥 Add team members and cashiers</li>
                <li>• 💰 Start processing sales</li>
              </ul>
            </div>

            <Button 
              onClick={() => {
                if (!tutorialCompleted) {
                  setShowTutorial(true);
                } else {
                  onProceed();
                }
              }} 
              className="bg-green-600 hover:bg-green-700 transform hover:scale-105 transition-all duration-200"
            >
              🎯 Get Started with eKahera
            </Button>
            
            <div className="mt-4 text-sm text-gray-500">
              {!tutorialCompleted ? 'We\'ll guide you through the system!' : 'Welcome back!'}
            </div>
          </div>
        </div>
      </>
    );
  }

  // If rejected, show rejection message
  if (status === 'rejected') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-2xl w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-red-500 text-6xl mb-6">❌</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Additional Information Required
          </h2>
          <p className="text-gray-600 mb-6">
            Your business application requires additional information or documentation 
            before it can be approved.
          </p>

          {verification?.rejection_reason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-red-800 mb-2">Reason:</h3>
              <p className="text-red-700 text-sm">{verification.rejection_reason}</p>
            </div>
          )}

          <p className="text-gray-600 mb-6">
            Please review the feedback and resubmit your documents with the necessary 
            corrections or additional information.
          </p>

          <Button onClick={() => window.location.href = '/get-started'}>
            Update Application
          </Button>
        </div>
      </div>
    );
  }

  // If repass, show resubmission message
  if (status === 'repass') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-2xl w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-yellow-500 text-6xl mb-6">📄</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Document Resubmission Required
          </h2>
          <p className="text-gray-600 mb-6">
            Some of your submitted documents appear to be unclear or blurry. 
            Please resubmit clear, high-quality images for verification.
          </p>

          {verification?.resubmission_notes && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-yellow-800 mb-2">Specific Issues:</h3>
              <p className="text-yellow-700 text-sm">{verification.resubmission_notes}</p>
            </div>
          )}

          <p className="text-gray-600 mb-6">
            Please ensure documents are clear, well-lit, and all text is readable 
            before resubmitting.
          </p>

          <Button onClick={() => window.location.href = '/get-started'}>
            Resubmit Documents
          </Button>
        </div>
      </div>
    );
  }

  // If pending or not submitted, show waiting message
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-md p-8 text-center">
        <div className="text-blue-500 text-6xl mb-6">⏳</div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Verification in Progress
        </h2>
        <p className="text-gray-600 mb-6">
          Thank you for submitting your business application! Our verification team 
          is currently reviewing your documents.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-800 mb-2">What's Happening:</h3>
          <ul className="text-sm text-blue-700 text-left space-y-1">
            <li>• Your documents are being reviewed by our team</li>
            <li>• Verification typically takes 1-3 business days</li>
            <li>• You'll receive an email notification once complete</li>
            <li>• No action is required from you at this time</li>
          </ul>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800">
            <strong>Please check back in 1-3 business days</strong> or wait for our email notification.
          </p>
        </div>

        <div className="flex space-x-4 justify-center">
          <Button 
            onClick={fetchVerificationStatus}
            variant="outline"
          >
            Refresh Status
          </Button>
          <Button 
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              window.location.href = '/';
            }}
            variant="outline"
          >
            Logout
          </Button>
        </div>
      </div>
      
      {/* Tutorial Guide */}
      {showTutorial && (
        <TutorialGuide 
          onComplete={() => {
            setShowTutorial(false);
            setTutorialCompleted(true);
            localStorage.setItem(`tutorial_completed_${user.user_id}`, 'true');
            onProceed();
          }}
        />
      )}
    </div>
  );
}
