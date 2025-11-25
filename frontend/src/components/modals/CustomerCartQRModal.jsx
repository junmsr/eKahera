import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import BaseModal from "./BaseModal";

export default function CustomerCartQRModal({
  isOpen,
  onClose,
  cartItems,
  businessId,
  qrPayload,
}) {
  const navigate = useNavigate();

  const payload = useMemo(() => {
    if (qrPayload) return qrPayload;

    const items = (cartItems || []).map((i) => ({
      p: i.product_id,
      q: i.quantity,
    }));
    return JSON.stringify({
      t: "cart",
      b: businessId ? Number(businessId) : null,
      items,
    });
  }, [cartItems, businessId, qrPayload]);

  const qrSrc = useMemo(() => {
    const data = encodeURIComponent(payload);
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${data}&qzone=2&format=png&_=${Date.now()}`;
  }, [payload]);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Show to Cashier"
      subtitle="Let the cashier scan this QR code"
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
      size="sm"
      contentClassName="text-center space-y-3"
    >
      <img
        src={qrSrc}
        alt="Customer Cart QR"
        className="w-[300px] h-[300px] border-4 border-blue-200 rounded-2xl bg-white mx-auto shadow-lg"
      />
      <div className="text-blue-800 text-sm font-medium">
        Cashier scans this in POS to load your cart.
      </div>
      <button
        onClick={() => navigate("/customer-enter")}
        className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors duration-300"
      >
        Done
      </button>
    </BaseModal>
  );
}
