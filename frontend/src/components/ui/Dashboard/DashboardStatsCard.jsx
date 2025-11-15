import React from "react";
import Card from "../../common/Card";

function DashboardStatsCard({ stats, className = "", ...props }) {
  return (
    <Card
      className={`bg-white/85 backdrop-blur-md border border-white/60 shadow-xl ${className}`}
      {...props}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100/60 p-5 md:p-6">
        <div className="flex items-center justify-between sm:justify-start gap-4 pr-0 sm:pr-6">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-700 font-bold">
            ₱
          </div>
          <div className="flex flex-col">
            <span className="text-xs sm:text-[12px] font-semibold text-gray-600 uppercase tracking-wide">
              Today's Sales
            </span>
            <span className="text-xl sm:text-2xl md:text-3xl font-extrabold text-blue-700">
              ₱{stats.sales.toLocaleString()}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between sm:justify-center gap-4 px-0 sm:px-6 py-4 sm:py-0">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-700 font-bold">
            ↻
          </div>
          <div className="flex flex-col">
            <span className="text-xs sm:text-[12px] font-semibold text-gray-600 uppercase tracking-wide">
            </span>
            <span className="text-xl sm:text-2xl md:text-3xl font-extrabold text-blue-700">
              {stats.transactions}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-4 pl-0 sm:pl-6">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-700 font-bold">
            ★
          </div>
          <div className="flex flex-col text-right">
            <span className="text-xs sm:text-[12px] font-semibold text-gray-600 uppercase tracking-wide">
              Top Product
            </span>
            <span className="text-lg sm:text-xl md:text-2xl font-extrabold text-blue-700">
              {stats.topProduct}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default DashboardStatsCard;
