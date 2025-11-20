import React, { useState } from "react";
import BaseModal from "./BaseModal";
import ScannerCard from "../ui/POS/ScannerCard";
import Button from "../common/Button";
import { api } from "../../lib/api";

export default function ScanCustomerCartModal({ isOpen, onClose, onImport }) {
  const [scannerPaused, setScannerPaused] = useState(false);
  const [error, setError] = useState("");
  const token = sessionStorage.getItem("auth_token");

  const user = JSON.parse(sessionStorage.getItem("user") || "{}");

  const handleScan = async (result) => {
    const code = result?.[0]?.rawValue;
    if (!code) return;
    setScannerPaused(true);
    setError("");
    try {
      let payload;
      try {
        payload = JSON.parse(code);
      } catch (e) {
        throw new Error("Invalid QR payload");
      }
      if (!payload || payload.t !== "cart" || !Array.isArray(payload.items))
        throw new Error("Unsupported QR");

      const { b: businessId, items: compactItems } = payload;
      const cashierBusinessId = user?.businessId || user?.business_id;

      if (
        businessId &&
        cashierBusinessId &&
        Number(businessId) !== Number(cashierBusinessId)
      ) {
        throw new Error("This QR code is not valid for this store.");
      }

      const fullItems = [];
      for (const it of compactItems) {
        if (!it?.p || !it?.q) continue;
        const product = await api(`/api/products/${encodeURIComponent(it.p)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fullItems.push({
          product_id: product.product_id,
          sku: product.sku,
          name: product.product_name,
          quantity: Number(it.q),
          price: Number(product.selling_price || 0),
        });
      }
      if (fullItems.length === 0) throw new Error("No items to import");
      onImport(fullItems);
      onClose();
    } catch (e) {
      setError(e.message || "Failed to import");
    } finally {
      setScannerPaused(false);
    }
  };

  const footerContent = (
    <Button
      label="Close"
      variant="secondary"
      onClick={onClose}
      className="w-full"
    />
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Scan Customer Cart"
      subtitle="Ask customer to show their QR"
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
            d="M12 4v16m8-8H4"
          />
        </svg>
      }
      footer={footerContent}
      size="lg"
      contentClassName="space-y-3"
    >
      <div className="text-blue-800 text-sm font-medium">
        Ask the customer to show their cart QR code
      </div>
      <div className="h-[50vh]">
        <ScannerCard
          onScan={handleScan}
          paused={scannerPaused}
          onResume={() => setScannerPaused(false)}
          className="w-full h-full"
        />
      </div>
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}
    </BaseModal>
  );
}
