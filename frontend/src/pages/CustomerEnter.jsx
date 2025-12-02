import React, { useState } from "react";
import { motion } from "framer-motion";
import Background from "../components/layout/Background";
import ScannerCard from "../components/ui/POS/ScannerCard";
import { useNavigate, Link } from "react-router-dom";
import Button from "../components/common/Button";



export default function CustomerEnter() {
  const [paused, setPaused] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleScan = async (result) => {
    const code = result?.[0]?.rawValue;
    if (!code) return;

    setPaused(true);
    setIsScanning(true);
    setError(null);

    try {
      const url = new URL(code);
      const bid = url.searchParams.get("business_id");

      if (url.pathname.endsWith("/enter-store") && bid) {
        // Set business ID and generate a transaction number for this session
        localStorage.setItem("business_id", String(bid));
        // Clear old transaction data
        localStorage.removeItem('provisionalTransactionNumber');
        localStorage.removeItem('customerCart');
        // Generate and save new transaction number
        const timePart = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
        const randPart = Math.floor(1000 + Math.random() * 9000);
        const transactionNumber = `T-${String(bid).padStart(2, '0')}-${timePart}-${randPart}`;
        localStorage.setItem('provisionalTransactionNumber', transactionNumber);

        // New: Call backend /public/enter-store to create user
        try {
          const response = await fetch("/api/sales/public/enter-store", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ business_id: bid }),
          });

          if (!response.ok) {
            const errorData = await response.json();
          } else {
            const data = await response.json();
            // Store user_id and username in localStorage for use later (optional)
            if (data.user_id) localStorage.setItem("customer_user_id", data.user_id);
            if (data.username) localStorage.setItem("customer_username", data.username);
          }
        } catch (err) {
        }

        // Small delay for better UX feedback
        setTimeout(() => {
          navigate("/customer");
        }, 300);
      } else {
        // Handle invalid QR code format
        setError("Invalid QR Code. Please scan a valid store QR code.");
        setIsScanning(false);
        setPaused(false);
      }
    } catch (error) {
      // Handle cases where the scanned code is not a valid URL
      setError("Invalid QR Code. Please scan a valid store QR code.");
      alert("Invalid QR Code. Please scan a valid store QR code.");
      setIsScanning(false);
      setPaused(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut",
      },
    },
  };

  return (
    <Background variant="gradientBlue" pattern="dots" floatingElements overlay>
      {/* Animated background orbs */}
      <motion.div
        className="absolute -top-24 -left-24 w-[28rem] h-[28rem] rounded-full bg-gradient-to-br from-blue-400/15 to-cyan-400/10 blur-3xl"
        animate={{ scale: [1, 1.08, 1], opacity: [0.35, 0.5, 0.35] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 -right-24 w-[30rem] h-[30rem] rounded-full bg-gradient-to-bl from-indigo-400/15 to-purple-400/10 blur-3xl"
        animate={{ scale: [1, 1.12, 1], opacity: [0.3, 0.45, 0.3] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 pt-6 sm:pt-8 relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header with back button */}
        <motion.div
          className="absolute top-4 sm:top-6 left-4 sm:left-6 z-20"
          variants={itemVariants}
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/80 backdrop-blur-md border border-white/40 hover:bg-white/90 transition-all duration-300 shadow-lg hover:shadow-xl group"
          >
            <svg
              className="w-5 h-5 text-gray-700"
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
            <span className="font-semibold text-gray-700 hidden sm:inline">
              Back Home
            </span>
          </Link>
        </motion.div>

        {/* Main Content Container */}
        <div className="w-full max-w-4xl flex flex-col gap-6 sm:gap-8">
          {/* Top Section - Logo & Title */}
          <motion.div className="text-center" variants={itemVariants}>
            <motion.div
              className="inline-flex items-center justify-center gap-3 mb-6"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 180 }}
            >
              <motion.div
                className="p-4 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 rounded-2xl shadow-2xl relative group"
                animate={{
                  boxShadow: [
                    "0 10px 30px rgba(59, 130, 246, 0.3)",
                    "0 20px 40px rgba(59, 130, 246, 0.4)",
                    "0 10px 30px rgba(59, 130, 246, 0.3)",
                  ],
                }}
                transition={{ duration: 2.5, repeat: Infinity }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <svg
                  className="w-8 h-8 sm:w-9 sm:h-9 text-white relative z-10"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                  />
                </svg>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-3"
            >
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                Welcome to the Store !!!
              </p>
              <p className="text-base sm:text-lg text-gray-600 max-w-xl mx-auto leading-relaxed">
                Scan the store's QR code to access the self-checkout experience
              </p>
            </motion.div>
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid gap-6 lg:grid-cols-2 items-center">

            {/* Right: Scanner Card */}
            <motion.div
              className="flex items-center justify-center relative w-full"
              variants={cardVariants}
            >
              <div className="w-full aspect-square relative max-w-sm lg:max-w-md">
                {/* Glow effect behind scanner */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-indigo-600/20 rounded-2xl sm:rounded-lg blur-2xl -z-10"
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.4, 0.6, 0.4],
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                />

                {/* Scanner Container */}
                <div className="relative h-full rounded-2xl sm:rounded-3xl overflow-hidden border-3 sm:border-4 border-white/60 shadow-lg sm:shadow-2xl bg-white/10 backdrop-blur-sm">
                  {isScanning && !error && (
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center z-30 bg-black/40 backdrop-blur-md"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <motion.div
                        className="bg-white/95 backdrop-blur-md rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-xl sm:shadow-2xl border border-white/20 mx-4"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 200 }}
                      >
                        <div className="flex flex-col items-center gap-3 sm:gap-4">
                          <motion.div
                            className="w-12 h-12 sm:w-14 sm:h-14 border-3 sm:border-4 border-blue-500 border-t-indigo-600 rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                          />
                          <div className="text-center">
                            <p className="text-gray-900 font-semibold text-sm sm:text-base">
                              Recognizing store...
                            </p>
                            <p className="text-xs sm:text-sm text-gray-600 mt-1">
                              Please wait
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}

                  {error && (
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center z-30 bg-black/40 backdrop-blur-md"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <motion.div
                        className="bg-white/95 backdrop-blur-md rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-xl sm:shadow-2xl border border-white/20 mx-4"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 200 }}
                      >
                        <div className="flex flex-col items-center gap-4">
                          <motion.div
                            className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center bg-red-100 rounded-full"
                          >
                            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </motion.div>
                          <div className="text-center">
                            <p className="text-gray-900 font-semibold text-sm sm:text-base">
                              Invalid QR Code
                            </p>
                            <p className="text-xs sm:text-sm text-gray-600 mt-1">
                              {error}
                            </p>
                          </div>
                          <Button
                            label="Try Again"
                            variant="primary"
                            onClick={() => {
                              setError(null);
                              setPaused(false);
                              setIsScanning(false);
                            }}
                          />
                        </div>
                      </motion.div>
                    </motion.div>
                  )}

                  <ScannerCard
                    onScan={handleScan}
                    paused={paused}
                    onResume={() => {
                      setPaused(false);
                      setIsScanning(false);
                      setError(null);
                    }}
                    className="w-full h-full"
                  />
                </div>

                {/* Corner accents */}
                <div className="absolute -top-1.5 -left-1.5 sm:-top-2 sm:-left-2 w-5 h-5 sm:w-8 sm:h-8 border-2 border-white/40 rounded-tl-lg sm:rounded-tl-2xl" />
                <div className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-8 sm:h-8 border-2 border-white/40 rounded-tr-lg sm:rounded-tr-2xl" />
                <div className="absolute -bottom-1.5 -left-1.5 sm:-bottom-2 sm:-left-2 w-5 h-5 sm:w-8 sm:h-8 border-2 border-white/40 rounded-bl-lg sm:rounded-bl-2xl" />
                <div className="absolute -bottom-1.5 -right-1.5 sm:-bottom-2 sm:-right-2 w-5 h-5 sm:w-8 sm:h-8 border-2 border-white/40 rounded-br-lg sm:rounded-br-2xl" />

                {/* Corner accents */}
                <div className="absolute -top-2 -left-2 w-8 h-8 border-2 border-white/40 rounded-tl-2xl" />
                <div className="absolute -top-2 -right-2 w-8 h-8 border-2 border-white/40 rounded-tr-2xl" />
                <div className="absolute -bottom-2 -left-2 w-8 h-8 border-2 border-white/40 rounded-bl-2xl" />
                <div className="absolute -bottom-2 -right-2 w-8 h-8 border-2 border-white/40 rounded-br-2xl" />
              </div>
            </motion.div>

            {/* Left: Instructions Card */}
            <motion.div className="flex flex-col gap-4" variants={itemVariants}>
              <motion.div
                className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-lg shadow-2xl p-6 sm:p-8 hover:shadow-3xl transition-all duration-300 group overflow-hidden"
                whileTap={{ scale: 0.98 }}
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent" />

                <div className="relative z-10 space-y-5">
                  {/* Step indicator */}
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-blue-600 text-white font-bold shadow-lg">
                        1
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        Point Your Camera
                      </h3>
                      <p className="text-sm text-gray-600">
                        Position your device to scan the QR code displayed in
                        the store
                      </p>
                    </div>
                  </div>

                  <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-blue-600 text-white font-bold shadow-lg">
                        2
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        Scan the Code
                      </h3>
                      <p className="text-sm text-gray-600">
                        Allow camera access and keep the QR code in frame
                      </p>
                    </div>
                  </div>

                  <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-blue-600 to-pink-600 text-white font-bold shadow-lg">
                        3
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        Start Shopping
                      </h3>
                      <p className="text-sm text-gray-600">
                        You'll be connected to the store's self-checkout system
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Bottom Info Section */}
          <motion.div className="mt-4 sm:mt-8" variants={itemVariants}>
            <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-purple-50/80 backdrop-blur-md rounded-2xl border border-blue-200/40 p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <motion.div
                    className="flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </motion.div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Need Help?
                  </h3>
                  <p className="text-sm text-gray-600">
                    Make sure your device has camera permissions enabled. The QR
                    code is typically displayed at the store entrance or on
                    staff uniforms.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </Background>
  );
}
