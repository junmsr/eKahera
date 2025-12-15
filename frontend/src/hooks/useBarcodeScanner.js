import { useRef, useEffect } from 'react';

/**
 * Hook to detect hardware barcode scanner input
 * Hardware scanners typically send characters very quickly (< 50ms between chars)
 * followed by Enter key. This hook helps auto-submit when a scanner is detected.
 * 
 * @param {Function} onScan - Callback when barcode is detected (receives the scanned code)
 * @param {Object} options - Configuration options
 * @param {number} options.maxDelay - Maximum delay between characters to consider it a scanner (default: 100ms)
 * @param {string} options.inputSelector - CSS selector for the input to monitor (optional)
 */
export function useBarcodeScanner(onScan, options = {}) {
  const { maxDelay = 100, inputSelector } = options;
  const lastCharTimeRef = useRef(0);
  const inputValueRef = useRef('');

  useEffect(() => {
    if (!onScan || typeof onScan !== 'function') {
      return;
    }

    const handleKeyDown = (e) => {
      // Only handle if target is an input field (or matches selector if provided)
      const target = e.target;
      if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
        return;
      }

      if (inputSelector && !target.matches(inputSelector)) {
        return;
      }

      const now = Date.now();
      const timeSinceLastChar = now - lastCharTimeRef.current;

      // Track the current input value
      inputValueRef.current = target.value || '';

      // If Enter is pressed
      if (e.key === 'Enter') {
        const currentInput = target.value?.trim() || '';
        
        if (currentInput) {
          // If Enter comes very quickly after the last character (< 200ms), it's likely a scanner
          // Hardware scanners typically send Enter within 50-150ms of the last character
          if (timeSinceLastChar < 200) {
            e.preventDefault();
            e.stopPropagation();
            
            // Clear tracking
            lastCharTimeRef.current = 0;
            inputValueRef.current = '';
            
            // Call the scan handler
            onScan(currentInput);
            
            return;
          }
        }
      }

      // Track character input timing
      // Only track printable characters (not modifiers or special keys)
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        lastCharTimeRef.current = now;
      }
    };

    // Use capture phase to catch events early, before React's synthetic events
    // This ensures we can prevent default and stop propagation before React handlers fire
    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [onScan, maxDelay, inputSelector]);
}
