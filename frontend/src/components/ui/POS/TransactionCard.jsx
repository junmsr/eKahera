import React from "react";
import Card from "../../common/Card";

/**
 * Transaction Card Component
 * Displays transaction number in a prominent format
 */
function TransactionCard({
  transactionNumber,
  transactionId,
  className = "",
  ...props
}) {
  return (
    <Card
      className={`flex-shrink-0 bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-purple-50/80 backdrop-blur-md border border-blue-200/50 shadow-xl hover:shadow-2xl transition-all duration-300 ${className}`}
      variant="glass"
      microinteraction
      {...props}
    >
      <div className="flex flex-col items-center justify-center p-2 sm:p-3 h-full">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg
              className="w-4 h-4 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
            Transaction Number
          </span>
        </div>
        <div className="text-xl sm:text-2xl lg:text-3xl font-mono font-bold tracking-wider text-blue-900 break-all text-center mb-2">
          {transactionNumber || "—"}
        </div>
        <div className="text-xs text-gray-500 font-medium">
          ID: {transactionId ?? "—"}
        </div>
      </div>
    </Card>
  );
}

export default TransactionCard;
