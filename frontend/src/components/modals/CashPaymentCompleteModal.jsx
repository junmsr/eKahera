import React from "react";
import Button from "../common/Button";
import BaseModal from "./BaseModal";

function CashPaymentCompleteModal({
  isOpen,
  onClose,
  change = 0,
  payable = 0,
  onNewEntry,
  onReceipt,
}) {
  const footerContent = (
    <div className="w-full flex flex-col gap-3">
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
        className="w-full h-11 text-sm font-semibold bg-blue-700 hover:bg-blue-800 text-white"
        onClick={() => {
          if (onReceipt) onReceipt();
          else alert("Receipt");
        }}
      />
    </div>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Payment Complete"
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
            d="M5 13l4 4L19 7"
          />
        </svg>
      }
      footer={footerContent}
      size="sm"
      contentClassName="text-center space-y-4"
    >
      {/* Success Check Icon */}
      <div className="flex justify-center mb-2">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-7 w-7 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
      </div>

      {/* Change Amount */}
      <div className="bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl p-5 text-white">
        <div className="text-xs uppercase tracking-wide opacity-90 mb-2">
          Change
        </div>

        <div className="inline-flex items-baseline gap-2 bg-white text-blue-700 rounded-lg px-4 py-3 shadow-md">
          <span className="text-lg font-bold">₱</span>
          <span className="text-2xl font-bold">
            {Number(change).toFixed(2)}
          </span>
        </div>

        <div className="mt-4 text-sm opacity-90">Payable</div>
        <div className="text-sm font-semibold">
          ₱{Number(payable).toFixed(2)}
        </div>
      </div>
    </BaseModal>
  );
}

export default CashPaymentCompleteModal;
