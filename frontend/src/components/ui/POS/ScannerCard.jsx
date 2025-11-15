import React, { useState, useEffect, useRef } from "react";
import Card from "../../common/Card";
import Button from "../../common/Button";
import { Scanner } from "@yudiel/react-qr-scanner";

/**
 * Scanner Card Component
 * QR and barcode scanner interface
 */
function ScannerCard({
  onScan,
  paused,
  onResume,
  textMain = "text-blue-800",
  className = "",
  ...props
}) {
  const [facingMode, setFacingMode] = useState("user"); // Start with front camera (better for laptops)
  const [hasPermission, setHasPermission] = useState(null);
  const [error, setError] = useState("");
  const [isInitializing, setIsInitializing] = useState(true);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [videoDevices, setVideoDevices] = useState([]);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const audioContext = useRef(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Check camera permissions and try to initialize camera
    const checkPermissions = async () => {
      try {
        // Try to query permissions (may not work in all browsers)
        try {
          const result = await navigator.permissions.query({ name: "camera" });
          setHasPermission(result.state === "granted");

          if (result.state === "denied") {
            setError(
              "Camera access denied. Please enable camera permissions in your browser settings."
            );
            setIsInitializing(false);
            return;
          }

          result.addEventListener("change", () => {
            setHasPermission(result.state === "granted");
            if (result.state === "denied") {
              setError(
                "Camera access denied. Please enable camera permissions in your browser settings."
              );
            } else {
              setError("");
            }
          });
        } catch (permErr) {
          // Permissions API not supported, continue anyway
          console.log(
            "Permissions API not supported, attempting camera access..."
          );
        }

        // Try to enumerate devices to detect available cameras
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices.filter(
            (device) => device.kind === "videoinput"
          );
          console.log("Available cameras:", videoDevices.length);
          setVideoDevices(videoDevices);
          setHasMultipleCameras(videoDevices.length > 1);

          if (videoDevices.length === 0) {
            setError("No camera found. Please connect a camera.");
            setIsInitializing(false);
            return;
          }
        } catch (enumErr) {
          console.log("Could not enumerate devices, will try direct access...");
        }

        // Give a small delay to allow browser to process
        setTimeout(() => {
          setIsInitializing(false);
        }, 500);
      } catch (err) {
        console.error("Permission check error:", err);
        setIsInitializing(false);
      }
    };

    checkPermissions();
  }, []);

  // Detect mobile device
  useEffect(() => {
    setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
  }, []);

  // Initialize audio context for beep
  useEffect(() => {
    audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
  }, []);

  // Play beep sound on successful scan
  const playBeep = () => {
    if (audioContext.current) {
      const oscillator = audioContext.current.createOscillator();
      const gainNode = audioContext.current.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.current.destination);
      oscillator.frequency.setValueAtTime(800, audioContext.current.currentTime);
      gainNode.gain.setValueAtTime(0.3, audioContext.current.currentTime);
      oscillator.start();
      oscillator.stop(audioContext.current.currentTime + 0.1);
    }
  };

  // Single camera devices (laptops) don't need camera toggle

  const handleError = (err) => {
    console.error("Scanner error:", err);
    let errorMessage = "Scanner error occurred";
    let shouldRetry = false;

    if (err.name === "NotAllowedError") {
      errorMessage =
        "Camera access denied. Please allow camera access and refresh the page.";
      setHasPermission(false);
    } else if (err.name === "NotFoundError") {
      errorMessage =
        "No camera found. Please connect a camera and refresh the page.";
    } else if (err.name === "NotReadableError") {
      errorMessage = "Camera is being used by another application.";
    } else if (err.name === "OverconstrainedError") {
      // Try switching facing mode if we haven't tried both
      if (retryCount < 2) {
        setRetryCount((prev) => prev + 1);
        const newFacingMode = facingMode === "user" ? "environment" : "user";
        setFacingMode(newFacingMode);
        setError("");
        setIsInitializing(true);
        setTimeout(() => setIsInitializing(false), 1000);
        return;
      } else {
        // Try without facing mode constraint
        errorMessage =
          "Camera constraints not supported. Trying without constraints...";
        setFacingMode(null);
        shouldRetry = true;
      }
    } else if (err.name === "SecurityError") {
      errorMessage = "Camera access blocked. Please use HTTPS or localhost.";
    } else {
      // Unknown error - try retry
      if (retryCount < 2) {
        setRetryCount((prev) => prev + 1);
        shouldRetry = true;
      }
    }

    if (shouldRetry && retryCount < 2) {
      setIsInitializing(true);
      setTimeout(() => {
        setIsInitializing(false);
        setError("");
      }, 1000);
      return;
    }

    setError(errorMessage);
    // Auto-retry after 3 seconds
    setTimeout(() => {
      setError('');
      setIsInitializing(true);
      setTimeout(() => setIsInitializing(false), 1000);
    }, 3000);
  };
  return (
    <Card
      className={`flex-shrink-0 bg-white/80 backdrop-blur-md border border-white/60 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden ${className}`}
      variant="glass"
      microinteraction
      {...props}
    >
      <div className="flex flex-col h-full p-2 sm:p-3">
        <div
          className={`w-full text-center mb-2 font-bold text-xs sm:text-sm tracking-wide ${textMain} flex items-center justify-center gap-1.5`}
        >
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
              d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
            />
          </svg>
          SCAN QR & BARCODE
        </div>
        <div className="w-full h-40 sm:h-48 md:h-56 lg:h-64 bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-blue-100/80 rounded-xl flex items-center justify-center border-2 border-blue-200/50 shadow-inner overflow-hidden relative z-0 group">
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
                <Button
                  label="Retry"
                  size="sm"
                  variant="secondary"
                  className="mt-2"
                  onClick={() => {
                    setError("");
                    setRetryCount(0);
                    setIsInitializing(true);
                    // Try switching camera mode
                    setFacingMode((prev) =>
                      prev === "user" ? "environment" : "user"
                    );
                    setTimeout(() => setIsInitializing(false), 1000);
                  }}
                  microinteraction
                />
              </div>
            </div>
          ) : (
            <Scanner
              onScan={(result) => {
                console.log("Scanner result:", result);
                if (result && result.length > 0) {
                  const code = result[0]?.rawValue;
                  console.log("Detected code:", code);
                  if (code) {
                    playBeep(); // Audio feedback
                    onScan(result);
                  }
                }
              }}
              onError={handleError}
              paused={paused}
              // More flexible constraints - try without facingMode if it fails
              constraints={
                facingMode !== null
                  ? {
                      facingMode,
                      width: { ideal: 1280, min: 640 },
                      height: { ideal: 720, min: 480 },
                      frameRate: { ideal: 30, min: 15 },
                    }
                  : {
                      width: { ideal: 1280, min: 640 },
                      height: { ideal: 720, min: 480 },
                      frameRate: { ideal: 30, min: 15 },
                    }
              }
              // Reduce delay between decode attempts
              scanDelay={160}
              // Focus decoding to a center region to speed up detection
              area={{ top: "20%", right: "20%", bottom: "20%", left: "20%" }}
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
                  objectFit: "contain",
                  borderRadius: "1rem",
                  backgroundColor: "black",
                },
              }}
              classNames={{ container: "w-full h-full" }}
              formats={[
                "qr_code",
                "code_128",
                "code_39",
                "ean_13",
                "ean_8",
                "upc_a",
                "upc_e",
                "itf",
                "codabar",
                "data_matrix",
                "pdf417",
              ]}
              // Improve robustness on dark-on-light vs light-on-dark
              inversionAttempts="attemptBoth"
            />
          )}
          {!error && !isInitializing && paused && (
            <div className="absolute bottom-2 right-2 z-10 flex gap-2">
              <Button
                label="Resume"
                size="sm"
                variant="secondary"
                onClick={onResume}
                microinteraction
              />
              {isMobile && hasMultipleCameras && (
                <Button
                  label={facingMode === "user" ? "📷" : "📱"}
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
                    setIsInitializing(true);
                    setTimeout(() => setIsInitializing(false), 1000);
                  }}
                  microinteraction
                  title={facingMode === "user" ? "Switch to back camera" : "Switch to front camera"}
                />
              )}
              {isMobile && (
                <Button
                  label={torchEnabled ? "🔦" : "💡"}
                  size="sm"
                  variant="secondary"
                  onClick={() => setTorchEnabled(!torchEnabled)}
                  microinteraction
                  title={torchEnabled ? "Turn off flashlight" : "Turn on flashlight"}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export default ScannerCard;
