import React, { useEffect, useState, useCallback, useRef } from "react";
import BaseModal from "./BaseModal";
import Button from "../common/Button";
import { api } from "../../lib/api";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";

function AdminReceiptsModal({ isOpen, onClose }) {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef(null);
  const modalContentRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const fetchReceipts = async () => {
      setLoading(true);
      setError("");
      try {
        const token = sessionStorage.getItem("auth_token");
        const data = await api("/api/sales/business/recent", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setReceipts(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Error fetching receipts:", e);
        setError("Failed to load receipts. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchReceipts();
  }, [isOpen]);

  const openReceipt = useCallback((receipt) => {
    const url = new URL(window.location.origin + "/receipt");
    if (receipt.transaction_number)
      url.searchParams.set("tn", receipt.transaction_number);
    if (receipt.transaction_id)
      url.searchParams.set("tid", String(receipt.transaction_id));
    window.open(url.toString(), "_blank");
  }, []);

  const openReceiptByIndex = useCallback((index) => {
    if (!receipts[index]) return;
    openReceipt(receipts[index]);
  }, [receipts, openReceipt]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (!isOpen || !receipts.length) return;
    e.preventDefault();

    switch (e.key) {
      case 'ArrowUp': {
        setSelectedIndex(prev => {
          const newIndex = prev <= 0 ? receipts.length - 1 : prev - 1;
          // Use setTimeout to ensure state update is complete before scrolling
          setTimeout(() => {
            const items = containerRef.current?.querySelectorAll('button');
            const selectedItem = items?.[newIndex];
            if (selectedItem) {
              // Scroll the item into view with smooth behavior
              selectedItem.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'nearest'
              });
              selectedItem.focus({ preventScroll: true });
            }
          }, 0);
          return newIndex;
        });
        break;
      }
      case 'ArrowDown': {
        setSelectedIndex(prev => {
          const newIndex = prev >= receipts.length - 1 ? 0 : prev + 1;
          // Use setTimeout to ensure state update is complete before scrolling
          setTimeout(() => {
            const items = containerRef.current?.querySelectorAll('button');
            const selectedItem = items?.[newIndex];
            if (selectedItem) {
              // Scroll the item into view with smooth behavior
              selectedItem.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'nearest'
              });
              selectedItem.focus({ preventScroll: true });
            }
          }, 0);
          return newIndex;
        });
        break;
      }
      case 'Enter':
        e.preventDefault();
        if (receipts[selectedIndex]) {
          openReceipt(receipts[selectedIndex]);
        }
        break;
      case 'Escape':
        onClose();
        break;
      default:
        break;
    }
  }, [isOpen, receipts, selectedIndex, onClose, openReceipt]);

  // Set up keyboard shortcuts - removed as we're handling it in handleKeyDown

  // Reset selected index when modal opens or receipts change
  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(0);
      // Focus the container when it opens
      setTimeout(() => {
        const firstButton = containerRef.current?.querySelector('button');
        if (firstButton) {
          firstButton.focus({ preventScroll: true });
        }
      }, 100);
    }
  }, [isOpen, receipts]);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="All Transactions"
      subtitle="Latest transactions across all cashiers"
      size="lg"
      footer={
        <Button
          label="Close (Esc)"
          variant="secondary"
          onClick={onClose}
          className="w-full"
        />
      }
    >
      {loading && (
        <div className="text-sm text-gray-600 py-4 text-center">
          Loading transactions...
        </div>
      )}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-2">
          {error}
        </div>
      )}
      {!loading && !error && receipts.length === 0 && (
        <div className="text-sm text-gray-500 py-6 text-center">
          No transactions found.
        </div>
      )}
      <div 
        ref={containerRef}
        className="space-y-2 max-h-[60vh] overflow-y-auto outline-none"
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        {receipts.map((r, index) => (
          <button
            key={`${r.transaction_id}-${r.transaction_number}`}
            onClick={() => openReceipt(r)}
            className={`w-full text-left border rounded-xl px-3 py-2 transition-colors ${
              selectedIndex === index 
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
            }`}
            onFocus={() => setSelectedIndex(index)}
            tabIndex={0}
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {r.transaction_number || `TXN-${r.transaction_id || ''}`}
                </p>
                <p className="text-xs text-gray-600">
                  {new Date(r.updated_at || r.created_at).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-blue-700">
                  ₱{Number(r.total_amount || r.total || 0).toFixed(2)}
                </p>
                <p className="text-[11px] text-gray-600 uppercase">
                  {r.payment?.method || r.payment_type || 'cash'}
                </p>
              </div>
            </div>
            {(r.discount_percentage || r.discount_amount) && (
              <p className="text-[11px] text-emerald-700 mt-1">
                Discount applied{" "}
                {r.discount_percentage
                  ? `${r.discount_percentage}%`
                  : `₱${Number(r.discount_amount || 0).toFixed(2)}`}
              </p>
            )}
          </button>
        ))}
      </div>
    </BaseModal>
  );
}

export default AdminReceiptsModal;
