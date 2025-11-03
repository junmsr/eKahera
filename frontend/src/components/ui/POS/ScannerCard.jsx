import React, { useState, useEffect } from 'react';
import Card from '../../common/Card';
import Button from '../../common/Button';
import { Scanner } from '@yudiel/react-qr-scanner';

/**
 * Scanner Card Component
 * QR and barcode scanner interface
 */
function ScannerCard({
  onScan,
  paused,
  onResume,
  textMain = 'text-blue-800',
  className = '',
  ...props
}) {
  const [facingMode, setFacingMode] = useState('environment'); // Start with back camera
  const [hasPermission, setHasPermission] = useState(null);
  const [error, setError] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);
  // Always use fast scanning on laptop; single camera expected

  useEffect(() => {
    // Check camera permissions on mount
    const checkPermissions = async () => {
      try {
        const result = await navigator.permissions.query({ name: 'camera' });
        setHasPermission(result.state === 'granted');

        if (result.state === 'denied') {
          setError('Camera access denied. Please enable camera permissions in your browser settings.');
        } else if (result.state === 'prompt') {
          setError('Camera permission required. Click "Allow" when prompted.');
        }

        result.addEventListener('change', () => {
          setHasPermission(result.state === 'granted');
          if (result.state === 'denied') {
            setError('Camera access denied. Please enable camera permissions in your browser settings.');
          } else {
            setError('');
          }
        });
      } catch (err) {
        // Fallback for browsers that don't support permissions API
        console.log('Permissions API not supported, attempting camera access...');
      } finally {
        setIsInitializing(false);
      }
    };

    checkPermissions();
  }, []);

  // Single camera devices (laptops) don't need camera toggle

  const handleError = (err) => {
    console.error('Scanner error:', err);
    let errorMessage = 'Scanner error occurred';

    if (err.name === 'NotAllowedError') {
      errorMessage = 'Camera access denied. Please allow camera access and refresh the page.';
    } else if (err.name === 'NotFoundError') {
      errorMessage = 'No camera found. Please connect a camera and refresh the page.';
    } else if (err.name === 'NotReadableError') {
      errorMessage = 'Camera is being used by another application.';
    } else if (err.name === 'OverconstrainedError') {
      errorMessage = 'Camera constraints not supported. Trying different camera...';
      // Auto-switch camera on constraint error
      setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
      return;
    } else if (err.name === 'SecurityError') {
      errorMessage = 'Camera access blocked. Please use HTTPS or localhost.';
    }

    setError(errorMessage);
  };
  return (
    <Card 
      className={`flex-shrink-0 emphasized-card ${className}`} 
      variant="glass" 
      microinteraction 
      {...props}
    >
      <div className="flex flex-col items-center shadow-2xl">
        <div className={`w-full text-center mb-2 font-bold text-lg tracking-wide ${textMain}`}>SCAN QR & BARCODE</div>
        <div className="w-full h-56 md:h-64 lg:h-72 bg-gradient-to-b from-blue-100/60 to-blue-200/60 rounded-2xl flex items-center justify-center border-2 border-blue-300/40 mb-2 overflow-hidden relative z-0">
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
                    setError('');
                    setIsInitializing(true);
                    setTimeout(() => setIsInitializing(false), 1000);
                  }}
                  microinteraction
                />
              </div>
            </div>
          ) : (
            <Scanner
              onScan={(result) => {
                console.log('Scanner result:', result);
                if (result && result.length > 0) {
                  const code = result[0]?.rawValue;
                  console.log('Detected code:', code);
                  if (code) {
                    onScan(result);
                  }
                }
              }}
              onError={handleError}
              paused={paused}
              // Tighter video constraints can improve decoding latency
              constraints={{
                facingMode,
                width: { ideal: 640 },
                height: { ideal: 480 },
                frameRate: { ideal: 24 }
              }}
              // Reduce delay between decode attempts
              scanDelay={160}
              // Focus decoding to a center region to speed up detection
              area={{ top: '20%', right: '20%', bottom: '20%', left: '20%' }}
              styles={{
                container: { width: '100%', height: '100%', borderRadius: '1rem', overflow: 'visible' },
                video: {
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  borderRadius: '1rem',
                  backgroundColor: 'black',
                },
              }}
              classNames={{ container: 'w-full h-full' }}
              formats={['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'itf', 'codabar', 'data_matrix', 'pdf417']}
              // Improve robustness on dark-on-light vs light-on-dark
              inversionAttempts="attemptBoth"
            />
          )}
          {!error && !isInitializing && paused && (
            <Button
              label="Resume"
              size="sm"
              variant="secondary"
              className="absolute bottom-2 right-2 z-10"
              onClick={onResume}
              microinteraction
            />
          )}
        </div>
      </div>
    </Card>
  );
}

export default ScannerCard; 