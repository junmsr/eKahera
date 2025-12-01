import React from "react";
import { motion } from "framer-motion";
import Modal from "../../modals/Modal";
import Button from "../../common/Button";

function CheckoutModal({
  isOpen,
  onClose,
  total,
  method,
  setMethod,
  onPay,
  cart = [],
}) {
  const itemCount = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);

  const paymentMethods = [
    {
      id: "Cash",
      name: "Cash",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z"
          />
        </svg>
      ),
      description: "Pay with cash at counter",
    },
    {
      id: "GCash",
      name: "GCash",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
      ),
      description: "Pay online with GCash",
    },
    {
      id: "PayMaya",
      name: "PayMaya",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
      ),
      description: "Pay online with PayMaya",
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <motion.div
        className="space-y-8 p-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Cart Summary */}
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
              </div>
              <div>
                <div className="text-sm text-blue-600 font-medium">
                  Order Summary
                </div>
                <div className="text-xs text-blue-500">
                  {itemCount} item{itemCount !== 1 ? "s" : ""}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-blue-600 font-medium">Total</div>
              <div className="text-lg font-bold text-blue-900">
                ₱{total.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div>
          <h3 className="text-lg font-bold text-blue-900 mb-6">
            Choose Payment Method
          </h3>
          <div className="space-y-4">
            {paymentMethods.map((payment) => (
              <motion.div
                key={payment.id}
                className={`relative p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                  method === payment.id
                    ? "border-blue-500 bg-blue-50 shadow-md"
                    : "border-gray-200 bg-white"
                }`}
                onClick={() => setMethod(payment.id)}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      method === payment.id
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {payment.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-blue-900">
                      {payment.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {payment.description}
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      method === payment.id
                        ? "border-blue-500 bg-blue-500"
                        : "border-gray-300"
                    }`}
                  >
                    {method === payment.id && (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Pay Button */}
        <motion.div
          className="pt-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button
            label={`Pay ₱${total.toFixed(2)}`}
            variant="primary"
            onClick={() => onPay(method || "Cash")}
            microinteraction
            className="w-full py-3 text-lg font-semibold"
          />
        </motion.div>
      </motion.div>
    </Modal>
  );
}

export default CheckoutModal;
