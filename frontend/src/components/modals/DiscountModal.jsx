import React, { useState } from "react";
import Modal from "./Modal";

function DiscountModal({ isOpen, onClose }) {
  const [tab, setTab] = useState("FIX");
  const [value, setValue] = useState(0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Enter Discount" className="max-w-md">
      <div className="flex flex-col items-center px-4 pb-4 pt-2">
        {/* Tabs */}
        <div className="flex w-full justify-center mb-4 gap-2">
          <button
            className={`px-4 py-1 rounded-full font-bold text-sm ${tab === "FIX" ? "bg-blue-600 text-white" : "bg-transparent text-gray-700"}`}
            onClick={() => setTab("FIX")}
          >
            FIX
          </button>
          <button
            className={`px-4 py-1 rounded-full font-bold text-sm ${tab === "PERCENTAGE" ? "bg-blue-600 text-white" : "bg-transparent text-gray-700"}`}
            onClick={() => setTab("PERCENTAGE")}
          >
            PERCENTAGE
          </button>
          <button
            className={`px-4 py-1 rounded-full font-bold text-sm ${tab === "COUPON" ? "bg-blue-600 text-white" : "bg-transparent text-gray-700"}`}
            onClick={() => setTab("COUPON")}
          >
            COUPON
          </button>
        </div>
        {/* Discount Value */}
        <div className="w-full mb-2">
          <div className="text-xs font-bold text-gray-700 mb-1">DISCOUNT VALUE</div>
          <input
            type="number"
            value={value}
            onChange={e => setValue(e.target.value)}
            className="w-full text-center text-3xl font-mono border-2 border-gray-400 rounded-xl py-2 mb-2 focus:outline-none"
            min={0}
          />
        </div>
        {/* Divider and info */}
        <div className="w-full text-left text-xs text-gray-600 mb-1">Select discounts below</div>
        <hr className="w-full mb-2" />
        <div className="w-full text-center text-gray-400 text-sm mb-6">
          No option available.<br />
          Discount has not yet been setup.
        </div>
        {/* Buttons */}
        <button
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 rounded-lg mb-3 shadow"
        >
          CONFIRM
        </button>
        <button
          className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-2 rounded-lg shadow"
        >
          SETTINGS
        </button>
      </div>
    </Modal>
  );
}

export default DiscountModal;