import React, { useEffect, useState } from "react";
import BaseModal from "./BaseModal";
import Button from "../common/Button";
import { api } from "../../lib/api";

function DiscountModal({ isOpen, onClose, onApplyDiscount }) {
  const [showSettings, setShowSettings] = useState(false);
  const [discounts, setDiscounts] = useState([]);

  const [newDesc, setNewDesc] = useState("");
  const [newValue, setNewValue] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [settingsTab, setSettingsTab] = useState("PERCENTAGE");

  useEffect(() => {
    if (!isOpen) return;
    const fetchDiscounts = async () => {
      setLoading(true);
      setError("");
      try {
        const token = sessionStorage.getItem("auth_token");
        const data = await api("/api/discounts", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const discountList = (data || []).map(d => ({
          label: d.discount_name || `${d.discount_percentage}% off`,
          value: d.discount_percentage,
          discount_id: d.discount_id,
          type: "percentage"
        }));
        
        setDiscounts(discountList);
      } catch (e) {
        setError("Failed to load discounts");
      } finally {
        setLoading(false);
      }
    };
    fetchDiscounts();
  }, [isOpen]);

  const handleAddDiscount = async () => {
    if (!newDesc || !newValue) return;
    setSaving(true);
    try {
      const token = sessionStorage.getItem("auth_token");
      const payload = { 
        discount_name: newDesc, 
        discount_percentage: Number(newValue) 
      };
      
      const created = await api("/api/discounts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      
      setDiscounts(prev => [
        ...prev,
        {
          label: created.discount_name || newDesc,
          value: created.discount_percentage,
          discount_id: created.discount_id,
          type: "percentage"
        }
      ]);
      
      setNewDesc("");
      setNewValue("");
    } catch (e) {
      console.error("Failed to add discount:", e);
      setError("Failed to add discount. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (discountId) => {
    if (!discountId) return;
    
    try {
      const token = sessionStorage.getItem("auth_token");
      await api(`/api/discounts/${discountId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setDiscounts(prev => prev.filter(d => d.discount_id !== discountId));
      setSelectedIdx(null); // Reset selected index if the deleted discount was selected
    } catch (e) {
      console.error("Failed to remove discount:", e);
      setError("Failed to remove discount. Please try again.");
    }
  };

  const handleSaveSettings = () => {
    setShowSettings(false);
  };

  const handleApplyDiscount = () => {
    if (selectedIdx == null) return;
    const discount = discounts[selectedIdx];
    if (!discount) return;
    onApplyDiscount({
      type: discount.type,
      value: discount.value,
      label: discount.label,
      discount_id: discount.discount_id,
    });
    onClose();
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
        label="Apply Discount"
        variant="primary"
        onClick={handleApplyDiscount}
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
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Select Discount</h3>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-4 max-h-64 overflow-y-auto">
          {discounts.map((d, idx) => (
            <button
              key={`${d.type}-${idx}`}
              className={`p-3 border rounded text-center ${
                selectedIdx === idx
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
              onClick={() => setSelectedIdx(idx)}
            >
              <div className="font-medium">{d.label}</div>
              <div className="text-sm text-gray-500">{d.value}%</div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Settings Modal Content
  const renderSettings = () => (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          className={`flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
            settingsTab === "PERCENTAGE" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
          }`}
          onClick={() => setSettingsTab("PERCENTAGE")}
        >
          Percentage
        </button>
      </div>

      {/* Discount List */}
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {discounts.map((d, idx) => (
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
            inputMode={settingsTab === "PERCENTAGE" ? "numeric" : "decimal"}
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
            disabled={saving}
          >
            {saving ? "..." : "+"}
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
      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}
      {showSettings ? renderSettings() : renderMain()}
    </BaseModal>
  );
}

export default DiscountModal;
