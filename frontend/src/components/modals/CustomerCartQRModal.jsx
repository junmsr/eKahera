import React, { useMemo } from "react";
import BaseModal from "./BaseModal";

export default function CustomerCartQRModal({
  isOpen,
  onClose,
  cartItems,
  businessId,
}) {
  const payload = useMemo(() => {
    const items = (cartItems || []).map((i) => ({
      p: i.product_id,
      q: i.quantity,
    }));
    return JSON.stringify({
      t: "cart",
      b: businessId ? Number(businessId) : null,
      items,
    });
  }, [cartItems, businessId]);

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
    </BaseModal>
  );
}
