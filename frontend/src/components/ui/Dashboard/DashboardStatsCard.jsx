import React from "react";
import dayjs from "dayjs";
import Card from "../../common/Card";

function DashboardStatsCard({ stats, className = "", formatCurrency, rangeType, currentTime, ...props }) {
  // formatCurrency and rangeType are not used in this component but may be passed from parent
  // We destructure them to prevent them from being passed to DOM elements
  
  const formattedDate = currentTime ? currentTime.format("ddd, MMM D, YYYY") : "";
  const formattedTime = currentTime ? currentTime.format("h:mm A") : "";
  
  return (
    <Card
      className={`bg-white backdrop-blur-sm border border-gray-100 shadow-sm rounded-2xl ${className}`}
      {...props}
    >
      {/* Digital Clock Display */}
      {currentTime && (
        <div className="px-6 md:px-8 pt-6 md:pt-8 pb-4 border-b border-gray-200/60">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-4 shadow-lg">
            <div className="text-center">
              <div className="text-xs md:text-sm text-blue-100 font-medium uppercase tracking-wider mb-2">
                {formattedDate}
              </div>
              <div className="text-3xl md:text-4xl font-mono font-bold text-white drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]">
                {formattedTime}
              </div>
            </div>
          </div>
        </div>
      )}
      
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

      </div>
    </Card>
  );
}

export default DashboardStatsCard;
