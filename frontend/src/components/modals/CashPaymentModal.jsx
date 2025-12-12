import React, { useState, useRef } from "react";
import Button from "../common/Button";
import BaseModal from "./BaseModal";
import CashPaymentCompleteModal from "./CashPaymentCompleteModal";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";

function CashPaymentModal({ isOpen, onClose, total, onConfirm }) {
  const [amountReceived, setAmountReceived] = useState("");
  const [showComplete, setShowComplete] = useState(false);
  const [completeData, setCompleteData] = useState(null);
  const amountInputRef = useRef(null);
  const justSetExactAmount = useRef(false);

  const handleQuickAmount = (val) => setAmountReceived(Number(val).toString());

  const handleExactAmount = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    // Set as a number to avoid string formatting issues
    const exactAmount = Number(total).toFixed(2);
    setAmountReceived(exactAmount);
    justSetExactAmount.current = true;
    // Reset the flag after a short delay
    setTimeout(() => {
      justSetExactAmount.current = false;
    }, 200);
  };

  const handleProceed = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Get the current value from the input element directly (more reliable than state)
    const inputValue = amountInputRef.current?.value || amountReceived;
    
    // If we just set exact amount, use the total directly
    let amountToUse = inputValue;
    if (justSetExactAmount.current) {
      amountToUse = Number(total).toFixed(2);
    }
    
    // Trim and parse the input value
    const trimmedAmount = (amountToUse?.toString() || "").trim();
    if (!trimmedAmount) {
      alert("Please enter an amount.");
      return;
    }
    const received = Number(trimmedAmount);
    if (isNaN(received) || received <= 0) {
      alert("Please enter a valid amount.");
      return;
    }
    // Round both values to 2 decimal places to avoid floating-point precision issues
    const receivedRounded = Math.round(received * 100) / 100;
    const totalRounded = Math.round(total * 100) / 100;
    if (receivedRounded < totalRounded) {
      alert(`Amount received (₱${receivedRounded.toFixed(2)}) must be greater than or equal to total (₱${totalRounded.toFixed(2)}).`);
      return;
    }
    // compute change and show completion modal; delay calling parent onConfirm
    // so cashier can view the completion screen before the app navigates
    const change = Math.max(0, receivedRounded - totalRounded);
    setCompleteData({ change, payable: totalRounded, received: receivedRounded });
    setShowComplete(true);
  };
  
  // Handle completion modal close
  const handleCompleteClose = () => {
    setShowComplete(false);
    if (onClose) onClose();
  };
  
  // Handle new entry from completion modal
  const handleNewEntry = () => {
    setShowComplete(false);
    setAmountReceived("");
    if (onClose) onClose();
  };
  
  // Handle receipt printing from completion modal
  const handleReceipt = () => {
    if (onConfirm && completeData?.received != null) {
      onConfirm(Number(completeData.received));
    }
  };

  // Only set up keyboard shortcuts when not showing completion modal
  // Hooks must be called before any early returns
  useKeyboardShortcuts(
    [
      {
        key: "escape",
        action: onClose,
        enabled: isOpen && !showComplete,
        allowWhileTyping: true,
      },
      {
        key: "enter",
        action: (e) => {
          e.preventDefault();
          e.stopPropagation();
          handleProceed(e);
        },
        enabled: isOpen && !showComplete,
        allowWhileTyping: true,
      },
      {
        key: "e",
        action: handleExactAmount,
        enabled: isOpen && !showComplete,
        allowWhileTyping: true,
      },
    ],
    [isOpen, amountReceived, total, showComplete]
  );
  
  // Early return if not open and not showing completion modal
  if (!isOpen && !showComplete) return null;
  
  // Render completion modal if needed
  if (showComplete) {
    return (
      <CashPaymentCompleteModal
        isOpen={showComplete}
        onClose={handleCompleteClose}
        change={completeData?.change}
        payable={completeData?.payable}
        onNewEntry={handleNewEntry}
        onReceipt={handleReceipt}
      />
    );
  }

  const footerContent = (
    <>
      <Button
        label="Cancel (Esc)"
        variant="secondary"
        onClick={onClose}
        type="button"
        className="flex-1"
      />
      <Button
        label="Proceed (Enter)"
        variant="primary"
        type="button"
        onClick={handleProceed}
        className="flex-1"
      />
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Cash Payment"
      subtitle="Enter amount received"
      icon={
        <svg
          className="w-5 h-5 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      }
      footer={footerContent}
      size="md"
      contentClassName="space-y-4"
    >
      {/* Total Amount */}
      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl py-6 px-4 text-center">
        <div className="text-sm opacity-90 mb-2">Total Amount</div>
        <div className="text-4xl font-bold">₱{total.toFixed(2)}</div>
      </div>

      {/* Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Amount Received
        </label>
        <input
          ref={amountInputRef}
          type="number"
          step="0.01"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-center text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="₱0.00"
          value={amountReceived}
          onChange={(e) => {
            // Allow empty string or valid numbers
            const value = e.target.value;
            if (value === '' || /^\d*\.?\d*$/.test(value)) {
              setAmountReceived(value);
            }
          }}
        />
      </div>

      {/* Quick Select Buttons */}
      <div>
        <p className="text-xs text-gray-600 mb-2">Quick amounts:</p>
        <div className="grid grid-cols-3 gap-2">
          {[100, 200, 300, 400, 500, 600, 700, 800, 900].map((val) => (
            <button
              key={val}
              className="bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold py-2 rounded-lg transition-colors text-sm"
              onClick={() => handleQuickAmount(val)}
            >
              {val}
            </button>
          ))}
        </div>
      </div>

      {/* Exact Amount Button */}
      <Button
        label="Use Exact Amount (E)"
        className="w-full h-10 text-sm font-bold bg-slate-600 hover:bg-slate-700 text-white"
        onClick={handleExactAmount}
      />
      <div className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 space-y-1">
        <div className="flex items-center justify-between">
          <span>Use exact total:</span>
          <span className="font-mono bg-white px-2 py-0.5 rounded">E</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Proceed:</span>
          <span className="font-mono bg-white px-2 py-0.5 rounded">Enter</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Close:</span>
          <span className="font-mono bg-white px-2 py-0.5 rounded">Esc</span>
        </div>
      </div>
    </BaseModal>
  );
}

export default CashPaymentModal;
