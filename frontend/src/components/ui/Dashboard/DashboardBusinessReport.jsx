import React, { useEffect, useState } from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { api } from "../../../lib/api";
import ChartCard from "./ChartCard";

// ProfitTrendChart component that matches VisitorsChart structure
function ProfitTrendChart({ data, className = "", rangeType = "Custom" }) {
  const getChartTitle = (rangeType) => {
    switch (rangeType) {
      case "Day":
        return "Profit Today";
      case "Week":
        return "7-Day Profit Trend";
      case "Month":
        return "Monthly Profit Trend";
      case "Custom":
      default:
        return "Profit Trend";
    }
  };

  return (
    <ChartCard
      title={<span className="text-blue-700">{getChartTitle(rangeType)}</span>}
      className={`chart-export-container bg-white/80 backdrop-blur-md border border-white/60 shadow-xl ${className}`}
    >
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 20, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" tick={{ fill: "#374151", fontSize: 14 }} />
            <YAxis 
              tick={{ fill: "#374151", fontSize: 14 }}
              tickFormatter={(value) => `₱${value.toLocaleString()}`}
            />
            <Tooltip
              contentStyle={{
                background: "#fff",
                borderColor: "#e5e7eb",
                borderRadius: 8,
              }}
              formatter={(value) => [
                new Intl.NumberFormat('en-PH', {
                  style: 'currency',
                  currency: 'PHP',
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                }).format(value),
                'Profit'
              ]}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ r: 5, fill: "#3b82f6" }}
            />
          </LineChart>
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

export default function DashboardBusinessReport({ dateRange }) {
  const [profitTrend, setProfitTrend] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [keyMetrics, setKeyMetrics] = useState({});
  const [businessStats, setBusinessStats] = useState({
    cashFlow: 0,
    operatingCosts: 0,
    profitGrowth: 0,
  });

  const blueShades = [
    "#3b82f6",
    "#1d4ed8",
    "#1e40af",
    "#2563eb",
    "#60a5fa",
    "#93c5fd",
    "#bfdbfe",
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Format dates for API calls using dayjs if available, otherwise Date
        const formatDate = (date) => {
          if (!date) return null;
          // Handle dayjs objects
          if (date.format) {
            return date.format("YYYY-MM-DD");
          }
          // Handle Date objects
          const d = new Date(date);
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, "0");
          const day = String(d.getDate()).padStart(2, "0");
          return `${year}-${month}-${day}`;
        };

        const startDate = dateRange?.startDate
          ? formatDate(dateRange.startDate)
          : null;
        const endDate = dateRange?.endDate
          ? formatDate(dateRange.endDate)
          : null;

        // Build query string for API calls
        const buildQueryString = (params) => {
          const queryParams = new URLSearchParams();
          if (params.startDate)
            queryParams.append("startDate", params.startDate);
          if (params.endDate) queryParams.append("endDate", params.endDate);
          const queryString = queryParams.toString();
          return queryString ? `?${queryString}` : "";
        };

        const queryParams = {};
        if (startDate && endDate) {
          queryParams.startDate = startDate;
          queryParams.endDate = endDate;
        }
        const queryString = buildQueryString(queryParams);

        const [
          keyMetricsRes,
          profitTrendRes,
          paymentMethodsRes,
          productPerformanceRes,
          businessStatsRes,
        ] = await Promise.all([
          api(`/api/stats/key-metrics${queryString}`),
          api(`/api/stats/profit-trend${queryString}`),
          api(`/api/stats/payment-methods${queryString}`),
          api(`/api/stats/business-stats${queryString}`),
        ]);

        setKeyMetrics(keyMetricsRes || {});
        setProfitTrend(profitTrendRes || []);
        setPaymentMethods(paymentMethodsRes || []);
        setBusinessStats(businessStatsRes || {});
      } catch (error) {
        console.error("Error fetching business report data:", error);
      }
    };

    fetchData();
  }, [dateRange]);

  // Format the profit trend data to match the expected format
  const formatProfitData = (data) => {
    if (!data || !Array.isArray(data)) return [];
    
    return data.map(item => ({
      name: item.month || item.date || item.name,
      value: Number(item.profit || item.value || 0)
    }));
  };

  return (
    <section className="w-full px-5 md:px-8 py-6 bg-gray-50">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 w-full min-h-[350px]">
        {/* Profit Trends Chart */}
        <ProfitTrendChart 
          data={formatProfitData(profitTrend)} 
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
                label={({ name, value }) => `${name} ${value}%`}
                outerRadius={90}
                dataKey="value"
              >
                {paymentMethods.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={blueShades[index % blueShades.length]}
                  />
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
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

    </section>
  );
}
