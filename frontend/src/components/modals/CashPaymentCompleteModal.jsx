import React from "react";
import Button from "../common/Button";

function CashPaymentCompleteModal({ isOpen, onClose, change = 0, payable = 0, onNewEntry, onReceipt }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm p-5 relative">
        {/* Close button */}
        <button
          aria-label="Close"
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          onClick={onClose}
        >
          ✕
        </button>

        {/* Header with check icon */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h3 className="text-lg font-semibold text-gray-800">COMPLETED</h3>
        </div>

        <div className="bg-blue-400 rounded-2xl mt-4 p-5 text-white text-center">
          <div className="text-xs uppercase tracking-wide opacity-90">Change</div>

          <div className="mt-2 inline-flex items-baseline gap-2 bg-white text-blue-700 rounded-lg px-4 py-3 shadow-md">
            <span className="text-lg">₱</span>
            <span className="text-2xl font-bold">{Number(change).toFixed(2)}</span>
          </div>

          <div className="mt-3 text-sm opacity-90">Payable</div>
          <div className="text-sm font-semibold">₱{Number(payable).toFixed(2)}</div>

          <div className="mt-5 flex flex-col gap-3">
            <Button
              label="NEW ENTRY"
              className="w-full h-11 text-sm font-semibold"
              variant="primary"
              onClick={() => {
                if (onNewEntry) onNewEntry();
                else onClose();
              }}
            />

            <Button
              label="RECEIPT"
              className="w-full h-11 text-sm font-semibold text-white bg-blue-700 "
              onClick={() => {
                if (onReceipt) onReceipt();
                else alert('Receipt');
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default CashPaymentCompleteModal;
