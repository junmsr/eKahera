import React from "react";
import { motion } from "framer-motion";
import Button from "../../common/Button";

function ActionBar({ total, onCancel, onCheckout, disabled = false }) {
  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 px-4 pb-4 sm:pb-6 pt-3 bg-white/95 backdrop-blur-xl border-t border-blue-200/50 shadow-2xl"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="max-w-screen-md mx-auto flex items-center justify-between gap-3">
        <Button
          label="Cancel"
          variant="secondary"
          onClick={onCancel}
          microinteraction
          disabled={disabled}
          className="flex-shrink-0"
        />
        <Button
          label="Check Out"
          variant="primary"
          onClick={onCheckout}
          microinteraction
          disabled={disabled}
          className="flex-shrink-0"
        />
        <motion.div
          className="text-right text-sm flex-shrink-0 min-w-[100px]"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="text-blue-600 font-medium text-xs sm:text-sm">
            Order Total:
          </div>
          <div className="text-blue-900 font-extrabold text-lg sm:text-xl">
            ₱{total.toFixed(2)}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default ActionBar;
