import React, { useState } from "react";
import Modal from "./Modal";

function PriceCheckModal({ isOpen, onClose }) {
  const [sku, setSku] = useState("");
  const [product, setProduct] = useState(null);

  const handleCheck = () => {
    if (sku === "12345") {
      setProduct({
        name: "Sample Product",
        price: 150,
        sku: "12345",
      });
    } else {
      setProduct(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Price Check" className="max-w-md">
      {/* Exit X Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-2xl text-gray-400 hover:text-blue-600 focus:outline-none"
        aria-label="Close"
        type="button"
      >
        ×
      </button>
      <div className="flex flex-col items-center gap-4 p-4">
        <div className="w-full">
          <label className="block text-blue-700 font-semibold mb-2">Enter SKU or Barcode</label>
          <input
            type="text"
            value={sku}
            onChange={e => setSku(e.target.value)}
            className="w-full border border-blue-200 rounded px-4 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Enter SKU or scan barcode"
          />
        </div>
        <button
          onClick={handleCheck}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-400 text-white font-bold py-2 rounded shadow hover:from-blue-700 hover:to-blue-500 transition-all"
        >
          Check Price
        </button>
        {product ? (
          <div className="w-full bg-blue-50 rounded-lg shadow p-4 mt-2 flex flex-col items-center">
            <div className="text-lg font-semibold text-blue-700">{product.name}</div>
            <div className="text-2xl font-bold text-blue-900 mt-1 mb-1">₱{product.price.toFixed(2)}</div>
            <div className="text-xs text-gray-500">SKU: {product.sku}</div>
          </div>
        ) : sku ? (
          <div className="text-red-500 text-sm mt-2">No product found.</div>
        ) : null}
      </div>
    </Modal>
  );
}

export default PriceCheckModal;