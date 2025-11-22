import React from "react";
import Card from "../../common/Card";

function DashboardStatsCard({ stats, className = "", ...props }) {
  return (
    <Card
      className={`bg-white backdrop-blur-sm border border-gray-100 shadow-sm ${className}`}
      {...props}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200/40 p-8 md:p-10 items-center">
        {/* Sales Metric */}
        <div className="flex flex-col items-center justify-center gap-3 px-4 py-2">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-lg">
            ₱
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-tight mb-1">
              Today's Sales
            </span>
            <span className="text-3xl md:text-base font-bold text-gray-900">
              ₱{Number(stats.sales || 0).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Transactions Metric */}
        <div className="flex flex-col items-center justify-center gap-3 px-4 py-2">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-lg">
            ↻
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-tight mb-1">
              Transactions
            </span>
            <span className="text-3xl md:text-base font-bold text-gray-900">
              {Number(stats.transactions || 0).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Top Product Metric */}
        <div className="flex flex-col items-center justify-center gap-3 px-4 py-2">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-lg">
            ★
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-tight mb-1">
              Top Product
            </span>
            <span className="text-2xl md:text-base font-bold text-gray-900 text-center line-clamp-2">
              {stats.topProduct || "-"}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default DashboardStatsCard;
