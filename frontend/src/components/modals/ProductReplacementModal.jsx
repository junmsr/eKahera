import React, { useState } from "react";
import Modal from "./Modal";

function ProductReplacementModal({ isOpen, onClose, onConfirm }) {
  const [productReturn, setProductReturn] = useState("");
  const [transactionNumber, setTransactionNumber] = useState("");
  const [refundMethod, setRefundMethod] = useState("GCASH");

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Product Replacement" className="max-w-lg">
      {/* Exit "X" Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-2xl text-gray-400 hover:text-blue-600 focus:outline-none z-10"
        aria-label="Close"
        type="button"
      >
        ×
      </button>
      <div className="flex flex-col items-center px-4 pb-6 pt-2">
        <div className="grid grid-cols-2 gap-4 w-full mb-6">
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">Product Return:</label>
            <input
              type="text"
              className="border-2 border-blue-400 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="*Selected Product"
              value={productReturn}
              onChange={e => setProductReturn(e.target.value)}
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">Transaction Number:</label>
            <input
              type="text"
              className="border-2 border-blue-400 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Transaction Number"
              value={transactionNumber}
              onChange={e => setTransactionNumber(e.target.value)}
            />
          </div>
          <div className="flex flex-col col-span-2">
            <label className="text-sm font-medium mb-1">Refund Method:</label>
            <select
              className="border-2 border-blue-400 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={refundMethod}
              onChange={e => setRefundMethod(e.target.value)}
            >
              <option value="GCASH">GCASH</option>
              <option value="CASH">CASH</option>
              <option value="MAYA">MAYA</option>
            </select>
          </div>
        </div>
        <button
          className="w-40 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl shadow text-lg mt-2"
          onClick={() => onConfirm?.({ productReturn, transactionNumber, refundMethod })}
        >
          CONFIRM
        </button>
      </div>
    </Modal>
  );
}

export default ProductReplacementModal;