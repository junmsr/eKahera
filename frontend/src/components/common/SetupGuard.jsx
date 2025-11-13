import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { api } from "../../lib/api";
import Background from "../layout/Background";
import Logo from "../../assets/images/Logo.png"; // ✅ Kept as you requested

/**
 * SetupGuard Component
 * Checks if initial setup is needed and redirects to setup page if required
 */
export default function SetupGuard({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    checkSetupStatus();
  }, []);

  const checkSetupStatus = async () => {
    try {
      if (location.pathname === "/setup") {
        setLoading(false);
        return;
      }

      const response = await api("/api/auth/setup/status");

      if (response.needsSetup) {
        setNeedsSetup(true);
        navigate("/setup", { replace: true });
      } else {
        setNeedsSetup(false);
      }
    } catch (error) {
      console.error("Setup status check failed:", error);
      setNeedsSetup(false);
    } finally {
      setLoading(false);
    }
  };

  // Show loading screen while checking setup status
  if (loading) {
    return (
      <Background variant="gradientBlue" pattern="dots" overlay>
        <div className="flex h-screen items-center justify-center">
          <div
            className="flex flex-col items-center space-y-6 animate-fadeIn"
            style={{ animationDelay: "0.1s" }}
          >
            {/* Animated Logo Loader */}
            <div className="relative w-40 h-40 flex items-center justify-center">
              {/* Outer Spinning Ring */}
              <div className="absolute inset-0 border-4 border-blue-400 border-t-transparent rounded-full animate-spin-slow"></div>

              {/* Middle Spinning Ring */}
              <div className="absolute inset-2 border-3 border-blue-500 border-t-transparent rounded-full animate-spin-reverse"></div>

              {/* Logo Container */}
              <div className="relative w-24 h-24">
                {/* Glowing Pulse behind Logo */}
                <div className="absolute inset-0 rounded-full bg-blue-400 opacity-40 blur-2xl animate-pulse-slow"></div>

                {/* Trending Logo */}
                <img
                  src={Logo}
                  alt="Logo"
                  className="w-full h-full animate-trending transform transition-transform duration-700 hover:scale-110 drop-shadow-lg"
                />
              </div>
            </div>

            {/* Loading Text */}
            <div className="text-center">
              <p className="text-gray-900 font-semibold text-lg tracking-wide animate-shimmerText bg-gradient-to-r from-gray-600 via-blue-600 to-gray-600 bg-[length:200%_auto] text-transparent bg-clip-text">
                Checking system status...
              </p>
              <p className="text-gray-600 text-sm mt-1 animate-fadeIn delay-200">
                Preparing your environment, please hold on.
              </p>
            </div>
          </div>
        </div>

        {/* Custom Animations */}
        <style>
          {`
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .animate-fadeIn {
              animation: fadeIn 0.8s ease-out forwards;
            }

            @keyframes trending {
              0%, 100% { transform: translateY(0) rotate(0deg); }
              25% { transform: translateY(-8px) rotate(2deg); }
              50% { transform: translateY(-15px) rotate(0deg); }
              75% { transform: translateY(-8px) rotate(-2deg); }
            }
            .animate-trending {
              animation: trending 2s ease-in-out infinite;
            }

            @keyframes pulseSlow {
              0%, 100% { opacity: 0.3; transform: scale(0.9); }
              50% { opacity: 0.6; transform: scale(1.1); }
            }
            .animate-pulse-slow {
              animation: pulseSlow 2.4s ease-in-out infinite;
            }

            @keyframes shimmerText {
              0% { background-position: 0% 50%; }
              100% { background-position: 200% 50%; }
            }
            .animate-shimmerText {
              animation: shimmerText 2.5s linear infinite;
            }

            @keyframes spinSlow {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            .animate-spin-slow {
              animation: spinSlow 3s linear infinite;
            }

            @keyframes spinReverse {
              from { transform: rotate(360deg); }
              to { transform: rotate(0deg); }
            }
            .animate-spin-reverse {
              animation: spinReverse 2s linear infinite;
            }
          `}
        </style>
      </Background>
    );
  }

  if (needsSetup && location.pathname !== "/setup") {
    return null;
  }

  return children;
}
