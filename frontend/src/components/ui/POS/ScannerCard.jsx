import React, { useState, useEffect } from "react";
import Button from "../../common/Button";
import { Scanner } from "@yudiel/react-qr-scanner";

/**
 * Scanner Card Component
 * Camera controls for flash and flip
 */
function ScannerCard({
  paused,
  onResume,
  textMain = "text-blue-800",
  className = "",
  modalContext = false,
  ...props
}) {
  const [facingMode, setFacingMode] = useState("environment");
  const [error, setError] = useState("");
  const [isInitializing, setIsInitializing] = useState(!modalContext);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [modalInitialized, setModalInitialized] = useState(false);

  // Detect mobile device
  useEffect(() => {
    setIsMobile(
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )
    );
  }, []);

  // Check for multiple cameras
  useEffect(() => {
    const checkCameras = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(
          (device) => device.kind === "videoinput"
        );
        setHasMultipleCameras(videoDevices.length > 1);
        setIsInitializing(false);
      } catch (err) {
        console.error("Error checking cameras:", err);
        setIsInitializing(false);
      }
    };
    checkCameras();
  }, []);

  const handleError = (err) => {
    console.error("Camera error:", err);
    setError("Camera access failed. Please check permissions.");
  };

  return (
    <div
      className={`flex-shrink-0 bg-white/80 backdrop-blur-md border border-white/60 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden ${className}`}
    >
      <div className="flex flex-col h-full p-1 sm:p-2">
        <div
          className={`w-full text-center mb-1 font-bold text-xs tracking-wide ${textMain} flex items-center justify-center gap-1`}
        >
          <svg
            className="w-3 h-3"
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
          CAMERA CONTROLS
        </div>
        <div className="w-full flex-1 bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-blue-100/80 rounded-xl flex items-center justify-center border-2 border-blue-200/50 shadow-inner overflow-hidden relative z-0 group">
          {isInitializing ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm">Initializing camera...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full text-red-500 p-4">
              <div className="text-center">
                <p className="text-sm font-medium mb-2">Camera Error</p>
                <p className="text-xs">{error}</p>
              </div>
            </div>
          ) : (
            <Scanner
              onError={handleError}
              paused={paused}
              constraints={{
                facingMode,
                width: { ideal: 1920, min: 640 },
                height: { ideal: 1080, min: 480 },
                frameRate: { ideal: 30, min: 15 },
              }}
              torch={torchEnabled}
              styles={{
                container: {
                  width: "100%",
                  height: "100%",
                  borderRadius: "1rem",
                  overflow: "visible",
                },
                video: {
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: "1rem",
                  backgroundColor: "black",
                },
              }}
              classNames={{ container: "w-full h-full" }}
            />
          )}
          {!error && !isInitializing && (
            <div className="absolute bottom-2 right-2 z-10 flex gap-2">
              {isMobile && hasMultipleCameras && (
                <Button
                  label={
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  }
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setFacingMode((prev) =>
                      prev === "user" ? "environment" : "user"
                    );
                  }}
                  microinteraction
                  title={
                    facingMode === "user"
                      ? "Switch to back camera"
                      : "Switch to front camera"
                  }
                />
              )}
              {isMobile && (
                <Button
                  label={
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  }
                  size="sm"
                  variant="secondary"
                  onClick={() => setTorchEnabled(!torchEnabled)}
                  microinteraction
                  title={
                    torchEnabled ? "Turn off flashlight" : "Turn on flashlight"
                  }
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ScannerCard;
