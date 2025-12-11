import React, { useState } from "react";
import BaseModal from "./BaseModal";
import Button from "../common/Button";
import { api } from "../../lib/api";
import ScannerCard from "../ui/POS/ScannerCard";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";

function PriceCheckModal({ isOpen, onClose, sku, setSku }) {
  const [product, setProduct] = useState(null);

  const handleCheck = async () => {
    if (!sku) return;
    try {
      const businessId = localStorage.getItem("business_id");
      const query = businessId
        ? `?business_id=${encodeURIComponent(businessId)}`
        : "";
      const res = await api(
        `/api/products/public/sku/${encodeURIComponent(sku)}${query}`
      );
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

  const footerContent = (
    <Button
      label="Close (Esc)"
      variant="secondary"
      onClick={onClose}
      className="w-full"
    />
  );

  useKeyboardShortcuts(
    [
      {
        key: "escape",
        action: onClose,
        enabled: isOpen,
        allowWhileTyping: true,
      },
      {
        key: "enter",
        action: handleCheck,
        enabled: isOpen,
        allowWhileTyping: true,
      },
    ],
    [isOpen, sku]
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Price Check"
      subtitle="Scan or enter SKU/barcode"
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
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      }
      footer={footerContent}
      size="md"
      contentClassName="space-y-4"
    >
      {/* Scanner */}
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

      {/* Manual Input */}
      <div className="w-full">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Enter SKU or Barcode
        </label>
        <input
          type="text"
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter SKU or scan barcode"
        />
      </div>

      <div className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
        <div className="flex items-center justify-between">
          <span>Check price:</span>
          <span className="font-mono bg-white px-2 py-0.5 rounded">Enter</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Close:</span>
          <span className="font-mono bg-white px-2 py-0.5 rounded">Esc</span>
        </div>
      </div>

      {/* Results */}
      {product ? (
        <div className="w-full bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200/50">
          <div className="text-lg font-semibold text-blue-900 mb-1">
            {product.name}
          </div>
          <div className="text-3xl font-bold text-blue-600 mb-2">
            ₱{product.price.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500">SKU: {product.sku}</div>
        </div>
      ) : sku ? (
        <div className="text-red-500 text-sm text-center py-4">
          No product found.
        </div>
      ) : null}
    </BaseModal>
  );
}

export default PriceCheckModal;
