import React from "react";
import Button from "../common/Button";
import BaseModal from "./BaseModal";

function CheckoutModal({ isOpen, onClose, total, onSelectPayment }) {
  const footerContent = (
    <div className="w-full flex flex-col gap-3">
      <Button
        label="CASH"
        className="w-full h-12 text-base font-bold"
        onClick={() => onSelectPayment("cash")}
      />
      <Button
        label="GCASH"
        className="w-full h-12 text-base font-bold"
        onClick={() => onSelectPayment("gcash")}
      />
      <Button
        label="MAYA"
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
    </BaseModal>
  );
}

export default CheckoutModal;
