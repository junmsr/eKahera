import React, { useEffect, useState, useCallback, useRef } from "react";
import BaseModal from "./BaseModal";
import Button from "../common/Button";
import { api } from "../../lib/api";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";

function RecentReceiptsModal({ isOpen, onClose }) {
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
        const data = await api("/api/sales/cashier/recent", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setReceipts(Array.isArray(data) ? data : []);
      } catch (e) {
        setError("Failed to load receipts");
      } finally {
        setLoading(false);
      }
    };
    fetchReceipts();
  }, [isOpen]);

  const openReceipt = (receipt) => {
    const url = new URL(window.location.origin + "/receipt");
    if (receipt.transaction_number)
      url.searchParams.set("tn", receipt.transaction_number);
    if (receipt.transaction_id)
      url.searchParams.set("tid", String(receipt.transaction_id));
    window.open(url.toString(), "_blank");
  };

  const openReceiptByIndex = useCallback((index) => {
    if (!receipts[index]) return;
    openReceipt(receipts[index]);
  }, [receipts]);

  const handleKeyDown = useCallback((e) => {
    if (!isOpen || !receipts.length) return;
    e.preventDefault();

    switch (e.key) {
      case 'ArrowUp': {
        setSelectedIndex(prev => {
          const newIndex = prev <= 0 ? receipts.length - 1 : prev - 1;
          // Use setTimeout to ensure state update is complete before focusing
          setTimeout(() => {
            const items = containerRef.current?.querySelectorAll('button');
            if (items?.[newIndex]) {
              items[newIndex].focus({ preventScroll: true });
            }
          }, 0);
          return newIndex;
        });
        break;
      }
      case 'ArrowDown': {
        setSelectedIndex(prev => {
          const newIndex = prev >= receipts.length - 1 ? 0 : prev + 1;
          // Use setTimeout to ensure state update is complete before focusing
          setTimeout(() => {
            const items = containerRef.current?.querySelectorAll('button');
            if (items?.[newIndex]) {
              items[newIndex].focus({ preventScroll: true });
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

  // Reset selected index when modal opens or receipts change
  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(0);
      // Focus the container when it opens
      if (containerRef.current) {
        containerRef.current.focus({ preventScroll: true });
      }
    }
  }, [isOpen, receipts]);

  // Scroll to selected item when it changes
  useEffect(() => {
    if (containerRef.current && selectedIndex >= 0) {
      const container = containerRef.current;
      const selectedElement = container.children[selectedIndex];
      
      if (selectedElement) {
        const containerRect = container.getBoundingClientRect();
        const elementRect = selectedElement.getBoundingClientRect();
        
        // Check if element is out of view
        if (elementRect.top < containerRect.top) {
          // Scroll up if element is above viewport
          container.scrollBy(0, elementRect.top - containerRect.top - 10);
        } else if (elementRect.bottom > containerRect.bottom) {
          // Scroll down if element is below viewport
          container.scrollBy(0, elementRect.bottom - containerRect.bottom + 10);
        }
      }
    }
  }, [selectedIndex]);

  // Use direct event listeners for better reliability
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDownEvent = (e) => {
      if (['ArrowUp', 'ArrowDown', 'Enter', 'Escape'].includes(e.key)) {
        e.preventDefault();
        handleKeyDown(e);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('keydown', handleKeyDownEvent);
      // Focus the container when modal opens
      container.focus({ preventScroll: true });
      return () => {
        container.removeEventListener('keydown', handleKeyDownEvent);
      };
    }
  }, [isOpen, handleKeyDown]);

  // Remove useKeyboardShortcuts to prevent duplicate event handling
  // The direct event listener on the container is sufficient

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Recent Receipts"
      subtitle="Latest transactions handled by you"
      size="lg"
      contentRef={modalContentRef}
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
          Loading receipts...
        </div>
      )}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-2">
          {error}
        </div>
      )}
      {!loading && !error && receipts.length === 0 && (
        <div className="text-sm text-gray-500 py-6 text-center">
          No receipts found.
        </div>
      )}
      <div 
        className="space-y-2 max-h-[60vh] overflow-y-auto outline-none focus:outline-none" 
        ref={containerRef}
        tabIndex="0"
        role="listbox"
        aria-label="Recent receipts"
      >
        {receipts.map((r, idx) => (
          <button
            key={`${r.transaction_id}-${r.transaction_number}`}
            onClick={() => openReceipt(r)}
            className={`w-full text-left border rounded-xl px-3 py-2 transition-all duration-200 ${
              selectedIndex === idx 
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200 scale-[1.01] shadow-sm' 
                : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
            }`}
            onFocus={() => setSelectedIndex(idx)}
            role="option"
            aria-selected={selectedIndex === idx}
            tabIndex="-1"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {r.transaction_number || "Txn"}
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

export default RecentReceiptsModal;







