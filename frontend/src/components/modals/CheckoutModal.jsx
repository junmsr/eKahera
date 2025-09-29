import React from "react";
import Button from "../common/Button";

function CheckoutModal({ isOpen, onClose, total, onSelectPayment }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
      <div className="bg-white rounded-2xl shadow-lg w-[350px] p-6 relative">
        {/* Close button */}
        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
          onClick={onClose}
        >
          ✕
        </button>

        {/* Header */}
        <h2 className="text-lg font-bold text-gray-800 mb-4">CHECKOUT</h2>

        {/* Total Amount */}
        <div className="bg-blue-500 text-white rounded-xl py-4 text-center text-2xl font-bold mb-4">
          ₱{total.toFixed(2)}
        </div>

        {/* Payment Options */}
        <p className="text-center text-gray-600 mb-3">
          Choose Payment Option
        </p>
        <div className="flex flex-col gap-3">
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
      </div>
    </div>
  );
}

export default CheckoutModal;
