import React, { useState } from "react";
import BaseModal from "./BaseModal";
import Button from "../common/Button";

function DiscountModal({ isOpen, onClose, onApplyDiscount }) {
  // Main modal tab (FIX or PERCENTAGE)
  const [tab, setTab] = useState("FIX");
  // Settings modal state
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState("PERCENTAGE");

  // Discounts state
  const [percentageDiscounts, setPercentageDiscounts] = useState([
    { label: "PWD/Senior Citizen", value: "5%" },
  ]);
  const [fixedDiscounts, setFixedDiscounts] = useState([]);

  // Temp input states for adding new discounts
  const [newDesc, setNewDesc] = useState("");
  const [newValue, setNewValue] = useState("");

  // Selected discount index
  const [selectedIdx, setSelectedIdx] = useState(null);

  // Add discount handler
  const handleAddDiscount = () => {
    if (!newDesc || !newValue) return;
    if (settingsTab === "PERCENTAGE") {
      setPercentageDiscounts([
        ...percentageDiscounts,
        { label: newDesc, value: newValue + "%" },
      ]);
    } else {
      setFixedDiscounts([
        ...fixedDiscounts,
        { label: newDesc, value: parseFloat(newValue).toFixed(2) },
      ]);
    }
    setNewDesc("");
    setNewValue("");
  };

  // Remove discount handler
  const handleRemove = (idx) => {
    if (settingsTab === "PERCENTAGE") {
      setPercentageDiscounts(percentageDiscounts.filter((_, i) => i !== idx));
    } else {
      setFixedDiscounts(fixedDiscounts.filter((_, i) => i !== idx));
    }
  };

  // Save settings and return to main modal
  const handleSaveSettings = () => {
    setShowSettings(false);
  };

  // Confirm handler
  const handleConfirm = () => {
    const discounts =
      tab === "PERCENTAGE" ? percentageDiscounts : fixedDiscounts;
    if (selectedIdx !== null && discounts[selectedIdx]) {
      onApplyDiscount(discounts[selectedIdx]);
      setSelectedIdx(null);
      onClose();
    }
  };

  // Settings Footer
  const settingsFooterContent = (
    <Button
      label="Save Settings"
      variant="primary"
      onClick={handleSaveSettings}
      className="w-full"
    />
  );

  // Main Footer
  const mainFooterContent = (
    <div className="w-full space-y-2">
      <Button
        label="Confirm Selection"
        variant="primary"
        onClick={handleConfirm}
        disabled={selectedIdx === null}
        className="w-full"
      />
      <Button
        label="Manage Discounts"
        variant="secondary"
        onClick={() => setShowSettings(true)}
        className="w-full"
      />
    </div>
  );

  // Main Discount Modal
  const renderMain = () => {
    const discounts =
      tab === "PERCENTAGE" ? percentageDiscounts : fixedDiscounts;
    return (
      <div className="space-y-4">
        {/* Tabs */}
        <div className="flex gap-2">
          <button
            className={`flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
              tab === "FIX"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            onClick={() => {
              setTab("FIX");
              setSelectedIdx(null);
            }}
          >
            Fixed Amount
          </button>
          <button
            className={`flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
              tab === "PERCENTAGE"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            onClick={() => {
              setTab("PERCENTAGE");
              setSelectedIdx(null);
            }}
          >
            Percentage
          </button>
        </div>

        {/* Discount List */}
        <div className="space-y-2">
          {discounts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No discounts available yet.</p>
              <p className="text-xs mt-1">Set up discounts in settings.</p>
            </div>
          ) : (
            discounts.map((d, idx) => (
              <button
                key={idx}
                type="button"
                className={`w-full border-2 rounded-lg px-4 py-3 text-sm transition-all flex items-center justify-between ${
                  selectedIdx === idx
                    ? "border-blue-600 bg-blue-50 ring-2 ring-blue-300"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
                onClick={() => setSelectedIdx(idx)}
              >
                <span className="font-medium">{d.label}</span>
                <span
                  className={`font-bold ${
                    selectedIdx === idx ? "text-blue-600" : "text-gray-700"
                  }`}
                >
                  {d.value}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    );
  };

  // Settings Modal Content
  const renderSettings = () => (
    <div className="space-y-4">
      {/* Settings Tabs */}
      <div className="flex gap-2">
        <button
          className={`flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
            settingsTab === "PERCENTAGE"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
          onClick={() => setSettingsTab("PERCENTAGE")}
        >
          Percentage
        </button>
        <button
          className={`flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
            settingsTab === "FIXED"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
          onClick={() => setSettingsTab("FIXED")}
        >
          Fixed Amount
        </button>
      </div>

      {/* Discount List */}
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {(settingsTab === "PERCENTAGE"
          ? percentageDiscounts
          : fixedDiscounts
        ).map((d, idx) => (
          <div
            key={idx}
            className="flex gap-2 items-center bg-gray-50 p-3 rounded-lg"
          >
            <input
              className="flex-1 bg-transparent outline-none text-sm font-medium"
              value={d.label}
              readOnly
            />
            <input
              className="w-20 bg-transparent text-center outline-none text-sm font-medium"
              value={d.value}
              readOnly
            />
            <button
              className="text-red-500 hover:text-red-700 transition-colors p-1"
              onClick={() => handleRemove(idx)}
              title="Remove"
              type="button"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Add new discount */}
      <div className="space-y-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="text-sm font-semibold text-blue-900 mb-2">
          Add New Discount
        </div>
        <div className="flex gap-2">
          <input
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Description"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
          />
          <input
            className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={settingsTab === "PERCENTAGE" ? "0%" : "0.00"}
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            type="number"
            min="0"
          />
          <button
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold"
            onClick={handleAddDiscount}
            title="Add"
            type="button"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={showSettings ? "Manage Discounts" : "Select Discount"}
      subtitle={
        showSettings
          ? "Add or remove discount options"
          : "Choose a discount to apply"
      }
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
            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
          />
        </svg>
      }
      footer={showSettings ? settingsFooterContent : mainFooterContent}
      size="md"
      contentClassName="space-y-4"
    >
      {showSettings ? renderSettings() : renderMain()}
    </BaseModal>
  );
}

export default DiscountModal;
