import React, { useState } from "react";
import Modal from "./Modal";

function DiscountModal({ isOpen, onClose, onApplyDiscount }) {
  // Main modal tab (FIX or PERCENTAGE)
  const [tab, setTab] = useState("FIX");
  // Settings modal state
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState("PERCENTAGE");

  // Discounts state
  const [percentageDiscounts, setPercentageDiscounts] = useState([
    { label: "PWD/Senior Citizen", value: "5%" }
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
      setPercentageDiscounts([...percentageDiscounts, { label: newDesc, value: newValue + "%" }]);
    } else {
      setFixedDiscounts([...fixedDiscounts, { label: newDesc, value: parseFloat(newValue).toFixed(2) }]);
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
    const discounts = tab === "PERCENTAGE" ? percentageDiscounts : fixedDiscounts;
    if (selectedIdx !== null && discounts[selectedIdx]) {
      onApplyDiscount(discounts[selectedIdx]);
      setSelectedIdx(null);
      onClose();
    }
  };

  // Main Discount Modal
  const renderMain = () => {
    const discounts = tab === "PERCENTAGE" ? percentageDiscounts : fixedDiscounts;
    return (
      <div className="flex flex-col items-center px-4 pb-4 pt-2">
        {/* Tabs */}
        <div className="flex w-full justify-center mb-4 gap-2">
          <button
            className={`px-4 py-1 rounded-full font-bold text-sm ${tab === "FIX" ? "bg-blue-600 text-white" : "bg-transparent text-gray-700"}`}
            onClick={() => { setTab("FIX"); setSelectedIdx(null); }}
          >
            FIX
          </button>
          <button
            className={`px-4 py-1 rounded-full font-bold text-sm ${tab === "PERCENTAGE" ? "bg-blue-600 text-white" : "bg-transparent text-gray-700"}`}
            onClick={() => { setTab("PERCENTAGE"); setSelectedIdx(null); }}
          >
            PERCENTAGE
          </button>
        </div>
        {/* Divider and info */}
        <div className="w-full text-left text-xs text-gray-600 mb-1">Select discounts below</div>
        <hr className="w-full mb-2" />
        {/* Discount List */}
        <div className="w-full flex flex-col gap-2 mb-6">
          {discounts.length === 0 ? (
            <div className="w-full text-center text-gray-400 text-sm">
              No option available.<br />
              Discount has not yet been setup.
            </div>
          ) : (
            discounts.map((d, idx) => (
              <button
                key={idx}
                type="button"
                className={`flex gap-2 w-full items-center border rounded px-2 py-1 text-sm transition ${
                  selectedIdx === idx
                    ? "border-blue-600 bg-blue-50 ring-2 ring-blue-300"
                    : "border-gray-200 bg-white"
                }`}
                onClick={() => setSelectedIdx(idx)}
              >
                <input className="flex-1 bg-transparent outline-none" value={d.label} readOnly />
                <input className="w-20 bg-transparent text-center outline-none" value={d.value} readOnly />
                {selectedIdx === idx && (
                  <span className="ml-2 text-blue-600 font-bold">&#10003;</span>
                )}
              </button>
            ))
          )}
        </div>
        {/* Buttons */}
        <button
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 rounded-lg mb-3 shadow disabled:opacity-50"
          onClick={handleConfirm}
          disabled={selectedIdx === null}
        >
          CONFIRM
        </button>
        <button
          className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-2 rounded-lg shadow"
          onClick={() => setShowSettings(true)}
        >
          SETTINGS
        </button>
      </div>
    );
  };

  // Settings Modal Content
  const renderSettings = () => (
    <div className="flex flex-col items-center px-4 pb-4 pt-2">
      {/* Settings Tabs */}
      <div className="flex w-full justify-center mb-4 gap-2">
        <button
          className={`px-4 py-1 rounded-full font-bold text-sm ${settingsTab === "PERCENTAGE" ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-700"}`}
          onClick={() => setSettingsTab("PERCENTAGE")}
        >
          Percentage Discount
        </button>
        <button
          className={`px-4 py-1 rounded-full font-bold text-sm ${settingsTab === "FIXED" ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-700"}`}
          onClick={() => setSettingsTab("FIXED")}
        >
          Fixed Amount Discount
        </button>
      </div>
      {/* Discount List */}
      <div className="flex flex-col w-full gap-2 mb-4">
        {(settingsTab === "PERCENTAGE" ? percentageDiscounts : fixedDiscounts).map((d, idx) => (
          <div key={idx} className="flex gap-2 items-center">
            <input
              className="flex-1 border rounded px-2 py-1 text-sm"
              value={d.label}
              readOnly
            />
            <input
              className="w-20 border rounded px-2 py-1 text-sm text-center"
              value={d.value}
              readOnly
            />
            <button
              className="text-blue-600 hover:text-red-500"
              onClick={() => handleRemove(idx)}
              title="Remove"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="inline w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
        {/* Add new discount */}
        <div className="flex gap-2 items-center">
          <input
            className="flex-1 border rounded px-2 py-1 text-sm"
            placeholder="Description"
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
          />
          <input
            className="w-20 border rounded px-2 py-1 text-sm text-center"
            placeholder={settingsTab === "PERCENTAGE" ? "0%" : "0.00"}
            value={newValue}
            onChange={e => setNewValue(e.target.value)}
            type="number"
            min="0"
          />
          <button
            className="text-blue-600 hover:text-blue-800 font-bold text-lg"
            onClick={handleAddDiscount}
            title="Add"
            type="button"
          >+</button>
        </div>
      </div>
      {/* Save Button */}
      <button
        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 rounded-lg shadow"
        onClick={handleSaveSettings}
      >
        SAVE
      </button>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Enter Discount" className="max-w-md">
      {/* Exit "X" Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-2xl text-gray-400 hover:text-blue-600 focus:outline-none z-10"
        aria-label="Close"
        type="button"
      >
        ×
      </button>
      {showSettings ? renderSettings() : renderMain()}
    </Modal>
  );
}

export default DiscountModal;