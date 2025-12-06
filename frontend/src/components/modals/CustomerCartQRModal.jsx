import React, { useMemo, useEffect, useState } from "react";
import { api } from "../../lib/api";
import BaseModal from "./BaseModal";
import Loader from "../common/Loader";

export default function CustomerCartQRModal({
  isOpen,
  onClose,
  qrPayload,
  transactionId,
  onTransactionComplete,
}) {
  const [status, setStatus] = useState("pending");
  const [error, setError] = useState("");

  const payload = useMemo(() => {
    if (qrPayload) return qrPayload;
    return "{}"; // Fallback for safety
  }, [qrPayload]);

  useEffect(() => {
    if (isOpen && transactionId) {
      const interval = setInterval(async () => {
        try {
          // API function automatically adds /api prefix, so don't include it
          const response = await api(`/sales/public/transaction/${transactionId}`);
          // Handle both wrapped and direct response formats
          const data = response.data || response;
          console.log('Transaction status check:', data);
          if (data && data.status === 'completed') {
            setStatus('completed');
            clearInterval(interval);
            if (onTransactionComplete) {
              // Pass transaction number to callback
              onTransactionComplete(data.tn || data.transaction_number);
            }
          } else if (data && data.status) {
            // Update status display
            setStatus(data.status);
          }
        } catch (err) {
          console.error('Error fetching transaction status:', err);
          setError('Could not fetch transaction status.');
          // Don't clear interval on error, keep trying
        }
      }, 3000); // Poll every 3 seconds

      return () => clearInterval(interval);
    }
  }, [isOpen, transactionId, onTransactionComplete]);

  // Reset internal state when the modal is closed
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStatus('pending');
        setError('');
      }, 300); // Delay reset to allow for closing animation
    }
  }, [isOpen]);

  const qrSrc = useMemo(() => {
    const data = encodeURIComponent(payload);
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${data}&qzone=2&format=png&_=${Date.now()}`;
  }, [payload]);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Show to Cashier"
      subtitle="Let the cashier scan this QR code to finalize payment."
      size="sm"
      contentClassName="text-center space-y-3"
    >
      <img
        src={qrSrc}
        alt="Customer Cart QR"
        className="w-[300px] h-[300px] border-4 border-blue-200 rounded-2xl bg-white mx-auto shadow-lg"
      />

      <div className="h-8">
        {status === 'pending' && (
          <div className="flex items-center justify-center space-x-2 text-blue-800 animate-pulse">
            <Loader size="sm" />
            <span>Waiting for cashier...</span>
          </div>
        )}
        {status === 'completed' && (
          <div className="text-green-600 font-bold">Transaction Complete! Redirecting...</div>
        )}
        {error && <div className="text-red-500 text-sm">{error}</div>}
      </div>

      <div className="pt-4">
        <button
          onClick={onClose}
          className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 px-4 rounded-lg transition-colors duration-300"
        >
          Cancel
        </button>
      </div>
    </BaseModal>
  );
}
