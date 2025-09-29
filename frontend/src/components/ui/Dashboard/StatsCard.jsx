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
    <Card className={`bg-white border border-gray-200 ${className}`} {...props}>
      <div className={`flex flex-col gap-3 p-5 ${loading ? "opacity-60" : ""}`}>
        <div className="flex items-center justify-between">
          <div className="bg-blue-50 rounded-lg p-2">{icon}</div>
          <div className={`text-sm font-semibold ${changeColor}`}>
            {changePrefix}
            {change}%
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-3xl font-bold text-gray-900">
            {formatDisplayValue()}
          </div>
          <div className="text-sm font-medium text-gray-600">{label}</div>
        </div>

        <div className="text-xs text-gray-500">{sub}</div>
      </div>
    </Card>
  );
}

export default StatsCard;
