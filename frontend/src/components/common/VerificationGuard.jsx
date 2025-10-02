import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import VerificationStatus from './VerificationStatus';
import TutorialGuide from './TutorialGuide';

/**
 * VerificationGuard Component
 * Checks business verification status for business owners and shows appropriate screens
 */
export default function VerificationGuard({ children }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialCompleted, setTutorialCompleted] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // Check if tutorial was already completed
      const tutorialStatus = localStorage.getItem(`tutorial_completed_${parsedUser.user_id}`);
      setTutorialCompleted(tutorialStatus === 'true');
    }
  }, []);

  // Skip verification check for certain routes
  const skipVerificationRoutes = [
    '/setup',
    '/login',
    '/get-started',
    '/',
    '/contact',
    '/services'
  ];

  const shouldSkipVerification = skipVerificationRoutes.some(route => 
    location.pathname === route || location.pathname.startsWith(route)
  );

  // Skip verification for non-business users or if no user
  if (!user || !user.businessId || user.role === 'superadmin' || shouldSkipVerification) {
    return (
      <>
        {children}
        {showTutorial && (
          <TutorialGuide 
            onComplete={() => {
              setShowTutorial(false);
              setTutorialCompleted(true);
              localStorage.setItem(`tutorial_completed_${user?.user_id}`, 'true');
            }}
          />
        )}
      </>
    );
  }

  const handleVerificationApproved = () => {
    if (!tutorialCompleted) {
      setShowTutorial(true);
    }
  };

  // Show verification status screen for business owners
  return (
    <VerificationStatus 
      user={user} 
      onProceed={handleVerificationApproved}
    />
  );
}
