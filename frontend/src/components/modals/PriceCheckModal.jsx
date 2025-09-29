import React, { useState } from "react";
import Modal from "./Modal";
import { api } from "../../lib/api";
import ScannerCard from "../ui/POS/ScannerCard";

function PriceCheckModal({ isOpen, onClose }) {
  const [sku, setSku] = useState("");
  const [product, setProduct] = useState(null);

  const handleCheck = async () => {
    if (!sku) return;
    try {
      const businessId = localStorage.getItem('business_id');
      const query = businessId ? `?business_id=${encodeURIComponent(businessId)}` : '';
      const res = await api(`/api/products/public/sku/${encodeURIComponent(sku)}${query}`);
      if (res) {
        setProduct({
          name: res.product_name,
          price: Number(res.selling_price || 0),
          sku: res.sku,
        });
      } else {
        setProduct(null);
      }
    } catch (_) {
      setProduct(null);
    }
  };

  // Auto-fetch on SKU change
  React.useEffect(() => {
    if (!sku) {
      setProduct(null);
      return;
    }
    const t = setTimeout(() => {
      handleCheck();
    }, 200);
    return () => clearTimeout(t);
  }, [sku]);

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
        {/* Optional embedded scanner */}
        <div className="w-full">
          <ScannerCard
            onScan={(result) => {
              const code = result?.[0]?.rawValue;
              if (code) {
                setSku(code);
              }
            }}
            paused={false}
            onResume={() => {}}
            className="w-full"
            textMain="text-blue-700"
          />
        </div>
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
        {/* Auto-updates; no need for a button */}
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