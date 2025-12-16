import React from "react";
import Button from "../common/Button";
import BaseModal from "./BaseModal";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";

function CheckoutModal({ isOpen, onClose, total, onSelectPayment }) {
  useKeyboardShortcuts(
    [
      { key: "1", action: () => onSelectPayment("cash"), enabled: isOpen },
      { key: "2", action: () => onSelectPayment("gcash"), enabled: isOpen },
      { key: "3", action: () => onSelectPayment("maya"), enabled: isOpen },
      { key: "enter", action: () => onSelectPayment("cash"), enabled: isOpen },
      { key: "escape", action: onClose, enabled: isOpen },
    ],
    [isOpen]
  );

  const footerContent = (
    <div className="w-full flex flex-col gap-3">
      <Button
        label="CASH (1 / Enter)"
        className="w-full h-12 text-base font-bold"
        onClick={() => onSelectPayment("cash")}
      />
      <Button
        label="GCASH (2)"
        className="w-full h-12 text-base font-bold"
        onClick={() => onSelectPayment("gcash")}
      />
      <Button
        label="MAYA (3)"
        className="w-full h-12 text-base font-bold"
        onClick={() => onSelectPayment("maya")}
      />
    </div>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Checkout"
      subtitle="Select payment method"
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
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      }
      footer={footerContent}
      size="sm"
      contentClassName="text-center"
    >
      <div className="bg-blue-500 text-white rounded-2xl py-6 px-4 text-center mb-4">
        <div className="text-sm opacity-90 mb-2">Total Amount</div>
        <div className="text-4xl font-bold">₱{total.toFixed(2)}</div>
      </div>
      <p className="text-gray-600 text-sm mb-4">
        Choose your preferred payment method
      </p>
      <div className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 space-y-1">
        <div className="flex items-center justify-between">
          <span>Cash:</span>
          <span className="font-mono bg-white px-2 py-0.5 rounded">1 / Enter</span>
        </div>
        <div className="flex items-center justify-between">
          <span>GCash:</span>
          <span className="font-mono bg-white px-2 py-0.5 rounded">2</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Maya:</span>
          <span className="font-mono bg-white px-2 py-0.5 rounded">3</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Close:</span>
          <span className="font-mono bg-white px-2 py-0.5 rounded">Esc</span>
        </div>
      </div>
    </BaseModal>
  );
}

export default CheckoutModal;
