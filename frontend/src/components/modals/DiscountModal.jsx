import React, { useEffect, useState, useCallback } from "react";
import BaseModal from "./BaseModal";
import Button from "../common/Button";
import { api } from "../../lib/api";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";

function DiscountModal({ isOpen, onClose, onApplyDiscount }) {
  const [showSettings, setShowSettings] = useState(false);
  const [discounts, setDiscounts] = useState([]);

  const [newDesc, setNewDesc] = useState("");
  const [newValue, setNewValue] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [settingsSelectedIdx, setSettingsSelectedIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [settingsTab, setSettingsTab] = useState("PERCENTAGE");
  
  // State for the custom delete confirmation modal
  const [deleteConfirmation, setDeleteConfirmation] = useState({ 
    isOpen: false, 
    id: null, 
    label: '' 
  });
  
  const descInputRef = React.useRef(null);
  const valueInputRef = React.useRef(null);
  const discountListRef = React.useRef(null);

  // Helper function to check if the event target is a form input
  const isTypingTarget = (el) => {
    if (!el) return false;
    const tag = el.tagName?.toLowerCase();
    return (
      el.isContentEditable ||
      tag === "input" ||
      tag === "textarea" ||
      el.getAttribute?.("role") === "textbox"
    );
  };

  const handleInputKeyDown = (e, field) => {
    // Handle Escape key first so it always blurs without closing the modal
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      e.target.blur();
      return;
    }

    // Handle Enter key - add discount if both fields have values
    if (e.key === "Enter" && showSettings) {
      if (newDesc && newValue) {
        e.preventDefault();
        e.stopPropagation();
        handleAddDiscount();
        return;
      }
    }

    // For the value field, only allow numbers and control keys
    if (field === 'value') {
      // Allow: backspace, delete, tab, escape, enter, arrows, home, end
      if ([8, 9, 27, 13, 37, 38, 39, 40, 35, 36, 46].includes(e.keyCode) ||
          // Allow: Ctrl+A, Ctrl+C, Ctrl+X, Ctrl+V, Ctrl+Z, Ctrl+Y
          (e.ctrlKey && [65, 67, 88, 86, 90, 89].includes(e.keyCode)) ||
          // Allow: numbers on top of keyboard and numpad
          (e.keyCode >= 48 && e.keyCode <= 57) ||
          (e.keyCode >= 96 && e.keyCode <= 105)) {
        // Let it happen, don't do anything
        return;
      }
      // Ensure that it is a number and stop the keypress
      if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
        e.preventDefault();
      }
    }
  };

  // When switching to settings view, focus the name field for immediate typing
  useEffect(() => {
    if (isOpen && showSettings) {
      requestAnimationFrame(() => {
        descInputRef.current?.focus();
        descInputRef.current?.select?.();
      });
    }
  }, [isOpen, showSettings]);

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

  /**
   * REFACTORED: This function now only sets the state to open the custom confirmation modal.
   * It no longer uses window.confirm.
   */
  const handleRemove = async (discountId) => {
    if (!discountId) return;
    
    const id = Number(discountId);
    if (isNaN(id)) {
      setError("Invalid discount ID");
      return;
    }
    
    const discountToDelete = discounts.find(d => Number(d.discount_id) === id);
    if (!discountToDelete) {
      setError("Discount not found in the list");
      return;
    }
    
    // Open custom confirmation modal
    setDeleteConfirmation({ isOpen: true, id: id, label: discountToDelete.label });
  };

  const cancelDelete = useCallback(() => {
    setDeleteConfirmation({ isOpen: false, id: null, label: '' });
  }, []);

  const confirmDelete = async () => {
    const id = deleteConfirmation.id;
    if (!id) return;

    try {
      setSaving(true);
      setError("");
      
      // Make the API call to delete the discount
      await api(`/api/discounts/${id}`, {
        method: "DELETE",
      });
      
      // Update local state to remove the deleted discount
      setDiscounts(prev => {
        const deletedIndex = prev.findIndex(d => Number(d.discount_id) === id);
        const newDiscounts = prev.filter(d => Number(d.discount_id) !== id);
        
        // Adjust selected indices if needed
        if (deletedIndex !== -1) {
          setSelectedIdx(prevIdx => {
            if (prevIdx === deletedIndex) return Math.max(0, deletedIndex - 1);
            if (prevIdx > deletedIndex) return prevIdx - 1;
            return prevIdx;
          });
          
          setSettingsSelectedIdx(prevIdx => {
            if (prevIdx === deletedIndex) return Math.max(0, deletedIndex - 1);
            if (prevIdx > deletedIndex) return prevIdx - 1;
            return prevIdx;
          });
        }
        
        return newDiscounts;
      });
      
      cancelDelete(); // Close the confirmation modal
      
    } catch (error) {
      console.error("Failed to remove discount:", error);
      
      // Handle 404 - discount not found
      if (error.message && error.message.includes("not found")) {
        // Refresh the discount list from the server
        try {
          const token = sessionStorage.getItem("auth_token");
          const data = await api("/api/discounts", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setDiscounts((data || []).map(d => ({
            label: d.discount_name || `${d.discount_percentage}% off`,
            value: d.discount_percentage,
            discount_id: d.discount_id,
            type: "percentage"
          })));
          setError("Discount not found. List has been refreshed.");
          cancelDelete(); // Close the confirmation modal even on 404
        } catch (refreshError) {
          console.error("Failed to refresh discounts:", refreshError);
          setError("Discount not found. Could not refresh list.");
        }
      } else {
        // For other errors
        setError(error.message || "Failed to remove discount. Please try again.");
      }
    } finally {
      setSaving(false);
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

  const applyDiscountByIndex = (idx) => {
    const discount = discounts[idx];
    if (!discount) return;
    setSelectedIdx(idx);
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
      label={
        <div className="w-full flex items-center justify-between">
          <span>Save Settings</span>
          <span className="text-xs font-mono bg-white/20 px-2 py-0.5 rounded">
            Enter
          </span>
        </div>
      }
      variant="primary"
      onClick={handleSaveSettings}
      className="w-full"
    />
  );

  // Main Footer
  const mainFooterContent = (
    <div className="w-full space-y-2">
      <Button
        label={
          <div className="w-full flex items-center justify-between">
            <span>Apply Discount</span>
            <span className="text-xs font-mono bg-white/20 px-2 py-0.5 rounded">
              Enter
            </span>
          </div>
        }
        variant="primary"
        onClick={handleApplyDiscount}
        disabled={selectedIdx === null}
        className="w-full"
      />
      <Button
        label={
          <div className="w-full flex items-center justify-between">
            <span>Manage Discounts</span>
            <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-700">
              M
            </span>
          </div>
        }
        variant="secondary"
        onClick={() => setShowSettings(true)}
        className="w-full"
      />
    </div>
  );


  // Scroll selected discount into view
  useEffect(() => {
    if (showSettings && discountListRef.current && settingsSelectedIdx !== null) {
      const container = discountListRef.current;
      const selectedElement = container.querySelector(`[data-discount-idx="${settingsSelectedIdx}"]`);
      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest'
        });
      }
    }
  }, [settingsSelectedIdx, showSettings]);

  // Auto-clear error messages after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Handle keyboard shortcuts
  useKeyboardShortcuts(
    [
      // Escape key - close modal or confirmation modal
      {
        key: "escape",
        action: (e) => {
          if (deleteConfirmation.isOpen) {
            cancelDelete();
            return;
          }
          if (isTypingTarget(e?.target)) {
            e.target.blur?.();
            return;
          }
          onClose();
        },
        enabled: isOpen,
        allowWhileTyping: true,
        stopPropagation: true,
        preventDefault: true
      },
      // Enter key - apply, save settings, or add discount depending on context
      {
        key: "enter",
        action: (e) => {
          // If confirmation modal is open, confirm deletion
          if (deleteConfirmation.isOpen) {
            e.preventDefault();
            confirmDelete();
            return;
          }
          
          // If we're in an input field, let the default behavior happen (but check for add discount)
          if (isTypingTarget(e?.target)) {
            // If we're in settings view and both fields have content, add a new discount
            if (showSettings && newDesc && newValue) {
              e.preventDefault();
              handleAddDiscount();
            }
            return;
          }
          
          // In settings view, save settings
          if (showSettings) {
            e.preventDefault();
            handleSaveSettings();
            return;
          }
          
          // In main view, apply the selected discount
          handleApplyDiscount();
        },
        enabled: isOpen,
        allowWhileTyping: true,
        stopPropagation: true,
        preventDefault: true
      },
      // M key - toggle manage discounts
      {
        key: "m",
        action: (e) => {
          if (isTypingTarget(e?.target) || deleteConfirmation.isOpen) return;
          setShowSettings((prev) => !prev);
        },
        enabled: isOpen,
        allowWhileTyping: false,
        stopPropagation: true,
        preventDefault: true
      },
      // Number keys 1-9 - select and apply discount (only when not typing)
      ...Array.from({ length: 9 }).map((_, i) => ({
        key: String(i + 1),
        action: (e) => {
          if (isTypingTarget(e?.target) || deleteConfirmation.isOpen) return;
          if (!showSettings && discounts[i]) {
            applyDiscountByIndex(i);
          }
        },
        enabled: isOpen && !showSettings && discounts[i],
        allowWhileTyping: false,
        stopPropagation: true,
        preventDefault: true
      })),
      // Arrow navigation for main list (ignore while typing)
      {
        key: "arrowup",
        action: (e) => {
          if (isTypingTarget(e?.target) || deleteConfirmation.isOpen) return;
          if (showSettings || discounts.length === 0) return;
          setSelectedIdx((prev) => {
            if (prev == null) return 0;
            return prev > 0 ? prev - 1 : 0;
          });
        },
        enabled: isOpen && !showSettings,
        allowWhileTyping: false,
        stopPropagation: true,
        preventDefault: true,
      },
      {
        key: "arrowdown",
        action: (e) => {
          if (isTypingTarget(e?.target) || deleteConfirmation.isOpen) return;
          if (showSettings || discounts.length === 0) return;
          setSelectedIdx((prev) => {
            if (prev == null) return 0;
            return Math.min(prev + 1, discounts.length - 1);
          });
        },
        enabled: isOpen && !showSettings,
        allowWhileTyping: false,
        stopPropagation: true,
        preventDefault: true,
      },
      // Focus description field
      {
        key: "n",
        action: (e) => {
          if (isTypingTarget(e?.target) && e.target !== descInputRef.current) return;
          if (!showSettings || deleteConfirmation.isOpen) return;
          setTimeout(() => {
            descInputRef.current?.focus();
            descInputRef.current?.select?.();
          }, 0);
        },
        enabled: isOpen && showSettings,
        allowWhileTyping: true,
        stopPropagation: false,
        preventDefault: false,
      },
      // Focus value field
      {
        key: "v",
        action: (e) => {
          if (isTypingTarget(e?.target) && e.target !== valueInputRef.current) return;
          if (!showSettings || deleteConfirmation.isOpen) return;
          setTimeout(() => {
            valueInputRef.current?.focus();
            valueInputRef.current?.select?.();
          }, 0);
        },
        enabled: isOpen && showSettings,
        allowWhileTyping: true,
        stopPropagation: false,
        preventDefault: false,
      },
      // Manage: navigate rows (ignore while typing in inputs)
      {
        key: "arrowup",
        action: (e) => {
          if (isTypingTarget(e?.target) || deleteConfirmation.isOpen) return;
          if (!showSettings || discounts.length === 0) return;
          setSettingsSelectedIdx((prev) => Math.max(0, prev - 1));
        },
        enabled: isOpen && showSettings,
        allowWhileTyping: false,
        stopPropagation: true,
        preventDefault: true,
      },
      {
        key: "arrowdown",
        action: (e) => {
          if (isTypingTarget(e?.target) || deleteConfirmation.isOpen) return;
          if (!showSettings || discounts.length === 0) return;
          setSettingsSelectedIdx((prev) =>
            Math.min(discounts.length - 1, (prev ?? 0) + 1)
          );
        },
        enabled: isOpen && showSettings,
        allowWhileTyping: false,
        stopPropagation: true,
        preventDefault: true,
      },
      // Manage: delete focused row (ignore while typing)
      {
        key: "delete",
        action: (e) => {
          if (isTypingTarget(e?.target) || deleteConfirmation.isOpen) return;
          if (!showSettings || discounts.length === 0) return;
          const target = discounts[settingsSelectedIdx];
          if (target?.discount_id) handleRemove(target.discount_id);
        },
        enabled: isOpen && showSettings,
        allowWhileTyping: false,
        stopPropagation: true,
        preventDefault: true,
      },
    ],
    [
      isOpen,
      showSettings,
      discounts,
      selectedIdx,
      handleApplyDiscount,
      handleSaveSettings,
      onClose,
      settingsSelectedIdx,
      handleAddDiscount,
      deleteConfirmation.isOpen,
      confirmDelete,
      cancelDelete,
    ]
  );

  // Main Discount Modal
  const renderMain = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Select Discount</h3>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Discounts (PWD/Senior Citizen) only apply to basic necessities as per Philippine law.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-4 max-h-64 overflow-y-auto">
          {discounts.map((d, idx) => (
            <button
              key={`${d.type}-${idx}`}
              className={`p-3 border rounded text-center ${
                selectedIdx === idx
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:bg-gray-50"
              } relative group`}
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
      <div 
        ref={discountListRef}
        className="space-y-2 max-h-60 overflow-y-auto pr-2 -mr-2"
      >
        {discounts.map((d, idx) => (
          <div
            key={idx}
            data-discount-idx={idx}
            className={`flex gap-2 items-center bg-gray-50 p-3 rounded-lg transition-all ${
              settingsSelectedIdx === idx ? "ring-2 ring-blue-400 bg-blue-50" : "hover:bg-gray-100"
            }`}
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
              onClick={() => handleRemove(d.discount_id)}
              title="Remove (Del)"
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
      <div
        className="space-y-2 p-4 bg-blue-50 rounded-lg border border-blue-200"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            e.stopPropagation();
            handleAddDiscount();
          }
        }}
      >
        <div className="text-sm font-semibold text-blue-900 mb-2">
          Add New Discount (N=Name, V=Value, Enter=Add)
        </div>
        <div className="flex gap-2">
          <input
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Description"
            value={newDesc}
            ref={descInputRef}
            onKeyDown={(e) => handleInputKeyDown(e, 'desc')}
            onFocus={() => setShowSettings(true)} // Ensure we're in settings mode when focused
            onChange={(e) => setNewDesc(e.target.value)}
          />
          <input
            className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={settingsTab === "PERCENTAGE" ? "0%" : "0.00"}
            inputMode={settingsTab === "PERCENTAGE" ? "numeric" : "decimal"}
            value={newValue}
            ref={valueInputRef}
            onKeyDown={(e) => handleInputKeyDown(e, 'value')}
            onFocus={() => setShowSettings(true)} // Ensure we're in settings mode when focused
            onChange={(e) => setNewValue(e.target.value)}
            type="number"
            min="0"
          />
          <button
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold"
            onClick={handleAddDiscount}
            title="Add (Enter)"
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
    <>
      {/* Primary Discount Modal */}
      <BaseModal
        isOpen={isOpen && !deleteConfirmation.isOpen} // Only open if delete modal is not open
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
        
        {/* Keyboard Shortcuts Guide */}
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="text-xs text-gray-500 space-y-1">
            {showSettings ? (
              <>
                <div className="flex items-center justify-between">
                  <span>Move selection:</span>
                  <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">↑ ↓</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Delete selected:</span>
                  <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">Del</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Focus name / value:</span>
                  <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">N / V</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Add/Save:</span>
                  <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">Enter</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span>Select discount:</span>
                  <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">1-9 / ↑↓</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Apply selected:</span>
                  <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">Enter</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Manage discounts:</span>
                  <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">M</span>
                </div>
              </>
            )}
            <div className="flex items-center justify-between pt-1 border-t border-gray-100 mt-1">
              <span>Close modal:</span>
              <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">Esc</span>
            </div>
          </div>
        </div>
      </BaseModal>

      {/* Custom Delete Confirmation Modal */}
      <BaseModal
        isOpen={deleteConfirmation.isOpen}
        onClose={cancelDelete}
        title="Confirm Discount Deletion"
        subtitle="This action cannot be undone."
        size="sm"
        footer={
          <div className="flex justify-end space-x-2 w-full">
            <Button 
              label="Cancel" 
              variant="secondary" 
              onClick={cancelDelete} 
              disabled={saving}
            />
            <Button 
              label={saving ? "Deleting..." : "Delete Discount"} 
              variant="danger" 
              onClick={confirmDelete} 
              disabled={saving}
            />
          </div>
        }
      >
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">
            Are you sure you want to permanently delete the discount: 
            <strong className="block mt-1 text-base font-semibold">{deleteConfirmation.label}</strong>
          </p>
        </div>
      </BaseModal>
    </>
  );
}

export default DiscountModal;