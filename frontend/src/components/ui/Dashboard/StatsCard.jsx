import React from "react";
import Card from "../../common/Card";

/**
 * Stats Card Component
 * Displays statistics with icon, value, and change indicator
 */
function StatsCard({
  label,
  value,
  change = 0,
  icon,
  sub = "",
  loading = false,
  formatValue = null,
  className = "",
  ...props
}) {
  const formatDisplayValue = () => {
    if (formatValue) return formatValue(value);
    if (label === "Growth Rate") return `${value}%`;
    if (label === "Total Revenue")
      return `₱${value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
      })}`;
    return value.toLocaleString();
  };

  const changeColor = change < 0 ? "text-red-500" : "text-emerald-500";
  const changePrefix = change > 0 ? "+" : "";

  return (
    <Card className={`bg-white/80 backdrop-blur-md border border-white/60 shadow-xl hover:shadow-2xl transition-all duration-500 group ${className}`} {...props}>
      <div className={`flex flex-col gap-5 p-6 ${loading ? "opacity-60" : ""}`}>
        <div className="flex items-center justify-between">
          <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl p-4 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">{icon}</div>
          <div className={`text-sm font-bold px-4 py-2 rounded-full shadow-md ${changeColor} ${change > 0 ? 'bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200' : 'bg-gradient-to-r from-red-50 to-orange-50 border border-red-200'}`}>
            {changePrefix}
            {change}%
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-4xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
            {formatDisplayValue()}
          </div>
          <div className="text-sm font-bold text-gray-700 uppercase tracking-wide">{label}</div>
        </div>

        <div className="text-xs text-gray-500 bg-gradient-to-r from-gray-50/80 to-blue-50/80 rounded-xl p-3 border border-gray-100/50">
          {sub}
        </div>
      </div>
    </Card>
  );
}

export default StatsCard;
