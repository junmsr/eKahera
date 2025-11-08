import React, { useState } from "react";
import { motion } from "framer-motion";
import Background from "../components/layout/Background";
import ScannerCard from "../components/ui/POS/ScannerCard";
import { useNavigate } from "react-router-dom";

function parseBusinessId(raw) {
  try {
    const u = new URL(raw);
    return (
      u.searchParams.get("business_id") ||
      u.searchParams.get("b") ||
      u.searchParams.get("store") ||
      raw
    );
  } catch (_) {
    try {
      const obj = JSON.parse(raw);
      return obj.business_id || obj.businessId || obj.storeId || raw;
    } catch (_) {
      return raw;
    }
  }
}

export default function CustomerEnter() {
  const [paused, setPaused] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const navigate = useNavigate();

  const handleScan = (result) => {
    const code = result?.[0]?.rawValue;
    if (!code) return;
    setPaused(true);
    setIsScanning(true);
    const bid = parseBusinessId(code);
    if (bid) {
      localStorage.setItem("business_id", String(bid));
      // Small delay for better UX feedback
      setTimeout(() => {
        navigate("/customer");
      }, 300);
    } else {
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
        {/* Instruction Card */}
        <motion.div
          className="w-full max-w-2xl mb-4 sm:mb-6"
          variants={itemVariants}
        >
          <motion.div
            className="bg-white/90 backdrop-blur-xl border border-white/60 rounded-2xl shadow-2xl p-6 sm:p-8 text-center relative overflow-hidden group hover:shadow-3xl transition-all duration-300"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            <div className="relative z-10">
              <motion.div
                className="flex items-center justify-center gap-3 mb-4"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              >
                <motion.div
                  className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg"
                  animate={{
                    boxShadow: [
                      "0 10px 25px rgba(59, 130, 246, 0.3)",
                      "0 15px 35px rgba(59, 130, 246, 0.4)",
                      "0 10px 25px rgba(59, 130, 246, 0.3)",
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <svg
                    className="w-6 h-6 sm:w-7 sm:h-7 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                    />
                  </svg>
                </motion.div>
                <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Welcome to eKahera
                </h2>
              </motion.div>

              <motion.p
                className="text-base sm:text-lg text-gray-700 leading-relaxed mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Please scan the QR code first so that eKahera can recognize
                which store you are currently in.
              </motion.p>

              {/* Visual indicator */}
              <motion.div
                className="flex items-center justify-center gap-2 text-sm text-gray-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                <motion.div
                  className="w-2 h-2 bg-blue-500 rounded-full"
                  animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <span>Point your camera at the QR code</span>
                <motion.div
                  className="w-2 h-2 bg-blue-500 rounded-full"
                  animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                />
              </motion.div>
            </div>
          </motion.div>
        </motion.div>

        {/* Scanner Card */}
        <motion.div
          className="w-full max-w-2xl flex-1 flex items-center justify-center relative"
          variants={cardVariants}
        >
          <div className="w-full h-full relative">
            {isScanning && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center z-30 bg-black/30 backdrop-blur-md rounded-2xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="bg-white/95 backdrop-blur-md rounded-xl p-6 shadow-2xl"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <div className="flex flex-col items-center gap-3">
                    <motion.div
                      className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                    <p className="text-gray-700 font-medium">
                      Recognizing store...
                    </p>
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
              }}
              className="w-full h-full"
            />
          </div>
        </motion.div>
      </motion.div>
    </Background>
  );
}
