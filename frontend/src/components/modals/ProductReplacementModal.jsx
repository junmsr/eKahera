import React, { useState } from "react";
import BaseModal from "./BaseModal";
import Button from "../common/Button";

function ProductReplacementModal({ isOpen, onClose, onConfirm }) {
  const [productReturn, setProductReturn] = useState("");
  const [transactionNumber, setTransactionNumber] = useState("");
  const [refundMethod, setRefundMethod] = useState("GCASH");

  const handleConfirm = () => {
    onConfirm?.({ productReturn, transactionNumber, refundMethod });
    setProductReturn("");
    setTransactionNumber("");
    setRefundMethod("GCASH");
  };

  const footerContent = (
    <>
      <Button
        label="Cancel"
        variant="secondary"
        onClick={onClose}
        type="button"
        className="flex-1"
      />
      <Button
        label="Confirm"
        variant="primary"
        type="button"
        onClick={handleConfirm}
        className="flex-1"
      />
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Product Replacement"
      subtitle="Process a product return and refund"
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
            d="M9 9l10.5-3m0 0L21 5m-10.5 3v12M21 5l-3 10.5m0 0L12 21m9-16v12"
          />
        </svg>
      }
      footer={footerContent}
      size="md"
      contentClassName="space-y-4"
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 md:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Return <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Selected Product"
            value={productReturn}
            onChange={(e) => setProductReturn(e.target.value)}
            required
          />
        </div>
        <div className="col-span-2 md:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Transaction Number <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Transaction Number"
            value={transactionNumber}
            onChange={(e) => setTransactionNumber(e.target.value)}
            required
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Refund Method <span className="text-red-500">*</span>
          </label>
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={refundMethod}
            onChange={(e) => setRefundMethod(e.target.value)}
          >
            <option value="GCASH">GCash</option>
            <option value="CASH">Cash</option>
            <option value="MAYA">Maya</option>
          </select>
        </div>
      </div>
    </BaseModal>
  );
}

export default ProductReplacementModal;
