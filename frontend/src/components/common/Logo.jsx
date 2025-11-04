import React, { useEffect, useState } from "react";
import logoImage from "../../assets/images/Logo.png";

/**
 * Logo Component
 * Displays the eKahera logo with text typing animation (no hover effect)
 */
function Logo({ size = 35, className = "", variant = "default" }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [displayText, setDisplayText] = useState("");
  const fullText = " | eKahera";

  // Typing effect
  useEffect(() => {
    setIsLoaded(true);
    let index = 0;
    const typingInterval = setInterval(() => {
      setDisplayText(fullText.slice(0, index + 1));
      index++;
      if (index === fullText.length) clearInterval(typingInterval);
    }, 150); // typing speed (ms per letter)

    return () => clearInterval(typingInterval);
  }, []);

  // Base styles
  const baseStyles = `flex items-center justify-center transition-all duration-300 ease-in-out ${
    isLoaded ? "animate-bounce-in" : "opacity-0 scale-75"
  }`;

  // Variant styles
  const variantStyles = {
    default: "shadow-none",
    flat: "shadow-none",
    gradient: "shadow-none",
  };

  // Combine styles
  const combinedStyles = `${baseStyles} ${variantStyles[variant]} ${className}`;

  return (
    <div className={combinedStyles} role="img" aria-label="eKahera Logo">
      {/* Logo Image */}
      <img
        src={logoImage}
        alt="eKahera Logo"
        className="object-contain bg-transparent"
        style={{ width: size, height: size }}
      />

      {/* Typing Text Animation */}
      <span className="ml-1 font-semibold text-black text-shadow-lg whitespace-nowrap">
        {displayText}
        <span className="animate-pulse">|</span> {/* blinking cursor */}
      </span>
    </div>
  );
}

export default Logo;
