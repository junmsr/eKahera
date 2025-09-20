import React, { useEffect, useState } from 'react';
import logoImage from '../../assets/images/Logo.png';

/**
 * Logo Component
 * Displays the eKahera logo with customizable size and styling
 */
function Logo({ 
  size = 35, 
  className = '',
  variant = 'default'
}) {
  const [isLoaded, setIsLoaded] = useState(false);

  // Trigger simple bounce animation when component mounts
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Base styles with simple animations
  const baseStyles = `flex items-center justify-center transition-all duration-300 ease-in-out hover:scale-110 group ${
    isLoaded ? 'animate-bounce-in' : 'opacity-0 scale-75'
  }`;
  
  // Variant styles
  const variantStyles = {
    default: "shadow-none",
    flat: "shadow-none",
    gradient: "shadow-none"
  };
  
  // Combine styles
  const combinedStyles = `${baseStyles} ${variantStyles[variant]} ${className}`;
  
  return (
    <div
      className={combinedStyles}
      role="img"
      aria-label="eKahera Logo"
    >
      <img 
        src={logoImage} 
        alt="eKahera Logo"
        className="object-contain bg-transparent"
        style={{ width: size, height: size }}
      />
      <span className="logo-text ml-1 font-bold text-blue-600 transition-transform duration-300 ease-in-out group-hover:translate-x-1">
    eKahera
      </span>
    </div>
  );
}

export default Logo; 