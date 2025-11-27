import React, { useState, useEffect, useRef } from "react";
import Card from "../../common/Card";
import Button from "../../common/Button";
import { Scanner } from "@yudiel/react-qr-scanner";
import Quagga from "@ericblade/quagga2";

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
  modalContext = false, // New prop to indicate if scanner is used in modal
  ...props
}) {
  const [facingMode, setFacingMode] = useState("environment"); // Start with rear camera (better for scanning)
  const [hasPermission, setHasPermission] = useState(null);
  const [error, setError] = useState("");
  const [isInitializing, setIsInitializing] = useState(!modalContext); // Don't auto-initialize in modal
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [videoDevices, setVideoDevices] = useState([]);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const audioContext = useRef(null);
  const [retryCount, setRetryCount] = useState(0);
  const [scanHistory, setScanHistory] = useState([]);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [useQuagga, setUseQuagga] = useState(false);
  const [quaggaInitialized, setQuaggaInitialized] = useState(false);
  const scannerRef = useRef(null);
  const [modalInitialized, setModalInitialized] = useState(false);
  const [usbInputBuffer, setUsbInputBuffer] = useState("");
  const [lastKeyTime, setLastKeyTime] = useState(0);

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

    // Only check permissions if not in modal context or if modal is already initialized
    if (!modalContext || modalInitialized) {
      checkPermissions();
    }
  }, [modalContext, modalInitialized]);

  // Initialize scanner when modal context is activated
  useEffect(() => {
    if (modalContext && !modalInitialized) {
      setModalInitialized(true);
    }
  }, [modalContext, modalInitialized]);

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

  // Trigger vibration on mobile devices for successful scan
  const vibrateOnScan = () => {
    if (isMobile && 'vibrate' in navigator) {
      navigator.vibrate(100); // 100ms vibration
    }
  };

  // USB Barcode Scanner Keyboard Input Handler
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Only process if not in an input field and scanner is not paused
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || paused) {
        return;
      }

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTime;

      // If more than 100ms since last key, start new scan
      if (timeDiff > 100) {
        setUsbInputBuffer(event.key);
      } else {
        // Accumulate input
        setUsbInputBuffer(prev => prev + event.key);
      }
      setLastKeyTime(currentTime);

      // If Enter key pressed, process the barcode
      if (event.key === 'Enter') {
        event.preventDefault();
          const barcode = usbInputBuffer.trim();
          if (barcode) {
            console.log("USB Scanner detected:", barcode);
            playBeep();
            vibrateOnScan();
            setScanHistory(prev => {
              const newHistory = [barcode, ...prev.filter(item => item !== barcode)].slice(0, 5);
              return newHistory;
            });
            onScan([{ rawValue: barcode }]);
          }
        setUsbInputBuffer("");
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [paused, lastKeyTime, usbInputBuffer, onScan, playBeep, vibrateOnScan]);

  // Initialize Quagga scanner
  const initQuagga = async () => {
    if (quaggaInitialized) return;

    try {
      await Quagga.init({
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: scannerRef.current,
          constraints: {
            facingMode: facingMode === "environment" ? "environment" : "user",
            width: { min: 640, ideal: 1920 },
            height: { min: 480, ideal: 1080 },
          },
        },
        locator: {
          patchSize: "medium",
          halfSample: true,
        },
        numOfWorkers: 2,
        decoder: {
          readers: [
            "code_128_reader",
            "ean_reader",
            "ean_8_reader",
            "code_39_reader",
            "code_39_vin_reader",
            "codabar_reader",
            "upc_reader",
            "upc_e_reader",
            "i2of5_reader",
            "2of5_reader",
            "code_93_reader",
          ],
        },
        locate: true,
      });

      Quagga.onDetected((result) => {
        if (result && result.codeResult) {
          const code = result.codeResult.code;
          console.log("Quagga detected:", code);
          playBeep();
          vibrateOnScan();
          setScanHistory(prev => {
            const newHistory = [code, ...prev.filter(item => item !== code)].slice(0, 5);
            return newHistory;
          });
          onScan([{ rawValue: code }]);
        }
      });

      Quagga.onProcessed((result) => {
        // Optional: Draw boxes around detected barcodes
        const drawingCtx = Quagga.canvas.ctx.overlay;
        const drawingCanvas = Quagga.canvas.dom.overlay;

        if (result) {
          if (result.boxes) {
            drawingCtx.clearRect(0, 0, parseInt(drawingCanvas.getAttribute("width")), parseInt(drawingCanvas.getAttribute("height")));
            result.boxes.filter(box => box !== result.box).forEach(box => {
              Quagga.ImageDebug.drawPath(box, { x: 0, y: 1 }, drawingCtx, { color: "green", lineWidth: 2 });
            });
          }

          if (result.box) {
            Quagga.ImageDebug.drawPath(result.box, { x: 0, y: 1 }, drawingCtx, { color: "#00F", lineWidth: 2 });
          }

          if (result.codeResult && result.codeResult.code) {
            Quagga.ImageDebug.drawPath(result.line, { x: 'x', y: 'y' }, drawingCtx, { color: 'red', lineWidth: 3 });
          }
        }
      });

      await Quagga.start();
      setQuaggaInitialized(true);
      console.log("Quagga scanner initialized");
    } catch (err) {
      console.error("Quagga initialization failed:", err);
      setError("Advanced scanner initialization failed. Using fallback scanner.");
    }
  };

  // Cleanup Quagga on unmount
  useEffect(() => {
    return () => {
      if (quaggaInitialized) {
        Quagga.offDetected();
        Quagga.offProcessed();
        Quagga.stop();
      }
    };
  }, [quaggaInitialized]);

  // Toggle between scanners
  const toggleScanner = () => {
    if (useQuagga && quaggaInitialized) {
      Quagga.stop();
      setQuaggaInitialized(false);
    }
    setUseQuagga(!useQuagga);
    setIsInitializing(true);
    setTimeout(() => setIsInitializing(false), 1000);
  };

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
      className={`flex-shrink-0 bg-white/80 backdrop-blur-md border border-white/60 shadow-xl ${className}`}
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
          ) : useQuagga ? (
            <div className="w-full h-full relative">
              <div ref={scannerRef} className="w-full h-full rounded-xl overflow-hidden"></div>
              {!quaggaInitialized && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <Button
                    label="Start Advanced Scanner"
                    size="sm"
                    variant="primary"
                    onClick={initQuagga}
                    microinteraction
                  />
                </div>
              )}
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
                    vibrateOnScan(); // Haptic feedback on mobile
                    // Add to scan history for quick re-selection
                    setScanHistory(prev => {
                      const newHistory = [code, ...prev.filter(item => item !== code)].slice(0, 5);
                      return newHistory;
                    });
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
                      width: { ideal: 1920, min: 640 },
                      height: { ideal: 1080, min: 480 },
                      frameRate: { ideal: 30, min: 15 },
                    }
                  : {
                      width: { ideal: 1920, min: 640 },
                      height: { ideal: 1080, min: 480 },
                      frameRate: { ideal: 30, min: 15 },
                    }
              }
              // Minimal delay for fastest scanning, especially for moving objects
              scanDelay={50}
              // Maximize scan area for better detection in various conditions
              area={{ top: "5%", right: "5%", bottom: "5%", left: "5%" }}
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
              // Enable multiple attempts for better detection in poor lighting
              multiple="true"
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
              <Button
                label="⌨️"
                size="sm"
                variant="secondary"
                onClick={() => setShowManualInput(!showManualInput)}
                microinteraction
                title="Manual input"
              />
              <Button
                label={useQuagga ? "🔄" : "⚡"}
                size="sm"
                variant="secondary"
                onClick={toggleScanner}
                microinteraction
                title={useQuagga ? "Switch to standard scanner" : "Switch to advanced scanner"}
              />
            </div>
          )}

          {/* Manual Input Modal */}
          {showManualInput && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-20">
              <div className="bg-white rounded-xl p-4 w-80 max-w-[90vw]">
                <h3 className="text-lg font-semibold mb-3 text-center">Manual SKU Input</h3>
                <input
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="Enter SKU or barcode"
                  className="w-full p-3 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && manualInput.trim()) {
                      onScan([{ rawValue: manualInput.trim() }]);
                      setManualInput("");
                      setShowManualInput(false);
                      playBeep();
                      vibrateOnScan();
                    }
                  }}
                />
                <div className="flex gap-2">
                  <Button
                    label="Cancel"
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setShowManualInput(false);
                      setManualInput("");
                    }}
                    className="flex-1"
                  />
                  <Button
                    label="Submit"
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      if (manualInput.trim()) {
                        onScan([{ rawValue: manualInput.trim() }]);
                        setManualInput("");
                        setShowManualInput(false);
                        playBeep();
                        vibrateOnScan();
                      }
                    }}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Scan History */}
          {scanHistory.length > 0 && !error && !isInitializing && paused && (
            <div className="absolute top-2 left-2 z-10">
              <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2 max-w-32">
                <p className="text-xs font-medium text-gray-700 mb-1">Recent:</p>
                <div className="space-y-1">
                  {scanHistory.slice(0, 3).map((code, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        onScan([{ rawValue: code }]);
                        playBeep();
                        vibrateOnScan();
                      }}
                      className="block w-full text-left text-xs text-blue-600 hover:text-blue-800 truncate"
                      title={`Scan ${code}`}
                    >
                      {code.length > 10 ? `${code.substring(0, 10)}...` : code}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export default ScannerCard;
