import React from "react";
import Card from "../../common/Card";

/**
 * Dashboard Stats Card Component
 * Displays dashboard statistics with sales, transactions, and top product
 */
function DashboardStatsCard({ stats, className = "", ...props }) {
  return (
    <Card
      className={`bg-gray-500 border border-gray-200 ${className}`}
      {...props}
    >
      <div className="flex flex-row items-center justify-between gap-6 p-6">
        <div className="flex flex-col gap-2">
          <span className="text-lg font-bold text-gray-900">Today's Sales</span>
          <span className="text-3xl font-bold text-blue-600">
            ₱{stats.sales.toLocaleString()}
          </span>
        </div>
        <div className="flex flex-col gap-2 items-center">
          <span className="text-lg font-bold text-gray-900">Transactions</span>
          <span className="text-2xl font-bold text-blue-600">
            {stats.transactions}
          </span>
        </div>
        <div className="flex flex-col gap-2 items-end">
          <span className="text-lg font-bold text-gray-900">Top Product</span>
          <span className="text-xl font-semibold text-blue-600">
            {stats.topProduct}
          </span>
        </div>
      </div>
    </Card>
  );
}

export default DashboardStatsCard;
