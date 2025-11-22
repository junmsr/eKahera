import React, { useState } from "react";
import Button from "../common/Button";
import BaseModal from "./BaseModal";
import CashPaymentCompleteModal from "./CashPaymentCompleteModal";

function CashPaymentModal({ isOpen, onClose, total, onConfirm }) {
  const [amountReceived, setAmountReceived] = useState("");
  const [showComplete, setShowComplete] = useState(false);
  const [completeData, setCompleteData] = useState(null);

  // Keep component mounted if completion modal should be shown even when parent closes isOpen
  if (!isOpen && !showComplete) return null;

  // When the payment is completed, replace this modal with the completion modal
  if (showComplete) {
    return (
      <CashPaymentCompleteModal
        isOpen={showComplete}
        onClose={() => {
          setShowComplete(false);
          if (onClose) onClose();
        }}
        change={completeData?.change}
        payable={completeData?.payable}
        onNewEntry={() => {
          setShowComplete(false);
          if (onClose) onClose();
        }}
        onReceipt={() => {
          // placeholder: can wire receipt logic here
          alert("Receipt generated");
        }}
      />
    );
  }

  const handleQuickAmount = (val) => setAmountReceived(val.toString());

  const handleExactAmount = () => setAmountReceived(total.toString());

  const handleProceed = () => {
    if (!amountReceived || Number(amountReceived) < total) {
      alert("Amount received must be greater than or equal to total.");
      return;
    }
    const received = Number(amountReceived);
    // notify parent/payment handler
    if (onConfirm) onConfirm(received);

    // compute change and show completion modal
    const change = received - total;
    setCompleteData({ change, payable: total });
    setShowComplete(true);
  };

  const footerContent = (
    <>
      <Button
        label="Cancel"
        variant="secondary"
        onClick={onClose}
        type="button"
        className="flex-1"
      />
      <Button
        label="Proceed"
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
          type="number"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-center text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="₱0.00"
          value={amountReceived}
          onChange={(e) => setAmountReceived(e.target.value)}
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
        label="Use Exact Amount"
        className="w-full h-10 text-sm font-bold bg-slate-600 hover:bg-slate-700 text-white"
        onClick={handleExactAmount}
      />
    </BaseModal>
  );
}

export default CashPaymentModal;
