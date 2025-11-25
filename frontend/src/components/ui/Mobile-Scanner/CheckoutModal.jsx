import React from "react";
import { useNavigate } from "react-router-dom";
import Modal from "../../modals/Modal";
import Button from "../../common/Button";

function CheckoutModal({ isOpen, onClose, total, method, setMethod, onPay }) {
  const navigate = useNavigate();

  const handleBackToHome = () => {
    onClose();
    navigate("/");
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="space-y-4">
        <div className="text-blue-900 font-bold text-lg">Pay using</div>
        <div className="space-y-2">
          <label className="flex items-center gap-3">
            <input
              type="radio"
              name="payment"
              checked={method === "Cash"}
              onChange={() => setMethod("Cash")}
            />
            <span className="text-blue-900">Cash</span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="radio"
              name="payment"
              checked={method === "GCash"}
              onChange={() => setMethod("GCash")}
            />
            <span className="text-blue-900">GCash</span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="radio"
              name="payment"
              checked={method === "PayMaya"}
              onChange={() => setMethod("PayMaya")}
            />
            <span className="text-blue-900">Pay Maya</span>
          </label>
        </div>
        <div className="flex items-center justify-between pt-2">
          <div className="text-blue-700">Total</div>
          <div className="text-blue-900 font-extrabold">
            ₱{total.toFixed(2)}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button
            label="Back to Home"
            variant="secondary"
            onClick={handleBackToHome}
            microinteraction
          />
          <Button
            label="Pay"
            variant="primary"
            onClick={() => onPay(method || "Cash")}
            microinteraction
          />
        </div>
      </div>
    </Modal>
  );
}

export default CheckoutModal;
