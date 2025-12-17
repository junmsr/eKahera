import React, { useEffect, useState } from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { api } from "../../../lib/api";
import ChartCard from "./ChartCard";

// ProfitTrendChart component that matches VisitorsChart structure
function ProfitTrendChart({ data, className = "", rangeType = "Custom" }) {
  const getChartTitle = (rangeType) => {
    return "Top 5 Products by Sales Volume";
  };

  return (
    <ChartCard
      title={<span className="text-blue-700">{getChartTitle(rangeType)}</span>}
      className={`chart-export-container bg-white/80 backdrop-blur-md border border-white/60 shadow-xl ${className}`}
    >
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              type="number"
              tick={{ fill: "#374151", fontSize: 10 }}
              tickFormatter={(value) => value.toLocaleString()}
            />
            <YAxis
              dataKey="name"
              type="category"
              tick={{ fill: "#374151", fontSize: 10 }}
              width={100}
            />
            <Tooltip
              contentStyle={{
                background: "#fff",
                borderColor: "#e5e7eb",
                borderRadius: 8,
              }}
              formatter={(value) => [
                `${Number(value).toLocaleString()} sold`,
                "Volume",
              ]}
            />
            <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

const TrendIcon = ({ trend }) => {
  if (trend === "up")
    return <span className="text-blue-600 font-semibold text-xl">↗</span>;
  if (trend === "down")
    return <span className="text-blue-400 font-semibold text-xl">↘</span>;
  return <span className="text-gray-400 font-semibold text-xl">→</span>;
};

export default function DashboardBusinessReport({
  dateRange,
  topProducts,
  paymentMethods,
}) {
  // Format the profit trend data to match the expected format
  const formatChartData = (data) => {
    if (!data || !Array.isArray(data)) return [];

    return data.slice(0, 5).map((item) => ({
      name: item.product_name || item.name,
      value: Number(item.total_sold || 0),
    }));
  };

  return (
    <section className="w-full px-5 md:px-8 py-6 bg-gray-50">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 w-full min-h-[350px]">
        {/* Profit Trends Chart */}
        <ProfitTrendChart
          data={formatChartData(topProducts)}
          rangeType={dateRange?.rangeType}
        />

        {/* Payment Methods */}
        <div className="chart-export-container bg-white/80 backdrop-blur-md border border-white/60 shadow-xl rounded-lg p-6">
          <h3 className="text-xl font-extrabold text-blue-700 mb-5 select-none">
            Payment Methods
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
              <Pie
                data={paymentMethods}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={false}
                outerRadius={90}
                dataKey="value"
              >
                {paymentMethods?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name, props) => [
                  `${Number(value).toFixed(0)}%`,
                  props?.payload?.name,
                ]}
                contentStyle={{
                  background: "#eff6ff",
                  borderColor: "#3b82f6",
                  borderRadius: 10,
                  fontWeight: "600",
                }}
                labelStyle={{ fontWeight: "700", color: "#1e40af" }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                formatter={(value, entry) => (
                  <span
                    style={{
                      color: "#374151",
                      fontSize: "12px",
                      fontWeight: "500",
                    }}
                  >
                    {value}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
