import React, { useEffect, useState } from "react";
import BaseModal from "./BaseModal";
import Button from "../common/Button";
import { api } from "../../lib/api";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";

function RecentReceiptsModal({ isOpen, onClose }) {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  const openReceiptByIndex = (index) => {
    if (!receipts[index]) return;
    openReceipt(receipts[index]);
  };

  useKeyboardShortcuts(
    [
      { key: "escape", action: onClose, enabled: isOpen },
      ...Array.from({ length: Math.min(9, receipts.length) }).map((_, i) => ({
        key: String(i + 1),
        action: () => openReceiptByIndex(i),
        enabled: isOpen && receipts[i],
      })),
    ],
    [isOpen, receipts]
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Recent Receipts"
      subtitle="Latest transactions handled by you"
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
      <div className="space-y-2 max-h-[60vh] overflow-y-auto">
        {receipts.map((r, idx) => (
          <button
            key={`${r.transaction_id}-${r.transaction_number}`}
            onClick={() => openReceipt(r)}
            className="w-full text-left border border-gray-200 rounded-xl px-3 py-2 hover:border-blue-300 hover:bg-blue-50 transition-colors"
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
                <span className="inline-block rounded bg-blue-100 text-blue-700 font-bold text-[11px] px-2 py-1 mb-1">
                  {idx + 1 <= 9 ? `${idx + 1}` : ""}
                </span>
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
      <div className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 space-y-1 mt-2">
        <div className="flex items-center justify-between">
          <span>Open receipt:</span>
          <span className="font-mono bg-white px-2 py-0.5 rounded">1-9</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Close:</span>
          <span className="font-mono bg-white px-2 py-0.5 rounded">Esc</span>
        </div>
      </div>
    </BaseModal>
  );
}

export default RecentReceiptsModal;







