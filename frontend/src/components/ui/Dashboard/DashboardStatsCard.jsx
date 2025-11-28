import React from "react";
import Card from "../../common/Card";

function DashboardStatsCard({ stats, className = "", ...props }) {
  return (
    <Card
      className={`bg-white backdrop-blur-sm border border-gray-100 shadow-sm rounded-2xl ${className}`}
      {...props}
    >
      <div className="grid grid-cols-1 divide-y divide-gray-200/60 p-6 md:p-8 space-y-4">
        {/* Sales Metric */}
        <div className="flex items-start gap-4 py-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 text-xl font-bold">
            ₱
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-gray-500 tracking-wide uppercase">
              Today's Sales
            </span>
            <span className="text-2xl md:text-xl font-bold text-gray-900 mt-0.5">
              ₱{Number(stats.sales || 0).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Transactions Metric */}
        <div className="flex items-start gap-4 py-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 text-xl font-bold">
            ↻
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-gray-500 tracking-wide uppercase">
              Transactions
            </span>
            <span className="text-2xl md:text-xl font-bold text-gray-900 mt-0.5">
              {Number(stats.transactions || 0).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Top Product Metric */}
        <div className="flex items-start gap-4 py-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 text-xl font-bold">
            ★
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-gray-500 tracking-wide uppercase">
              Top Product
            </span>
            <span className="text-xl md:text-lg font-bold text-gray-900 mt-0.5 leading-tight line-clamp-2">
              {stats.topProduct || "-"}
            </span>
          </div>
        </div>

        {/* Total Items Sold Metric */}
        <div className="flex items-start gap-4 py-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 text-xl font-bold">
            #
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-gray-500 tracking-wide uppercase">
              Total Items Sold
            </span>
            <span className="text-2xl md:text-xl font-bold text-gray-900 mt-0.5">
              {Number(stats.totalItemsSold || 0).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Avg TX Value Metric */}
        <div className="flex items-start gap-4 py-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 text-xl font-bold">
            ~
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-gray-500 tracking-wide uppercase">
              Avg TX Value
            </span>
            <span className="text-2xl md:text-xl font-bold text-gray-900 mt-0.5">
              ₱{Number(stats.averageTransactionValue || 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default DashboardStatsCard;
