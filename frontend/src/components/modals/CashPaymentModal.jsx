import React, { useState } from "react";
import Button from "../common/Button";

function CashPaymentModal({ isOpen, onClose, total, onConfirm }) {
  const [amountReceived, setAmountReceived] = useState("");

  if (!isOpen) return null;

  const handleQuickAmount = (val) => setAmountReceived(val.toString());

  const handleExactAmount = () => setAmountReceived(total.toString());

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

        {/* Total Amount */}
        <div className="bg-blue-500 text-white rounded-xl py-4 text-center text-2xl font-bold mb-4">
          ₱{total.toFixed(2)}
        </div>

        {/* Input */}
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Amount Received
        </label>
        <input
          type="number"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 text-center text-lg"
          placeholder="₱0.00"
          value={amountReceived}
          onChange={(e) => setAmountReceived(e.target.value)}
        />

        {/* Quick Select Buttons */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[100, 200, 300, 400, 500, 600, 700, 800, 900].map((val) => (
            <button
              key={val}
              className="bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold py-2 rounded-lg"
              onClick={() => handleQuickAmount(val)}
            >
              {val}
            </button>
          ))}
        </div>

        {/* Exact Amount Button */}
        <Button
          label="EXACT AMOUNT"
          className="w-full h-12 text-base font-bold mb-3"
          onClick={handleExactAmount}
        />

        {/* Proceed Button */}
        <Button
          label="PROCEED"
          className="w-full h-12 text-base font-bold"
          variant="primary"
          onClick={() => {
            if (!amountReceived || Number(amountReceived) < total) {
              alert("Amount received must be greater than or equal to total.");
              return;
            }
            onConfirm(Number(amountReceived));
            onClose();
          }}
        />
      </div>
    </div>
  );
}

export default CashPaymentModal;
