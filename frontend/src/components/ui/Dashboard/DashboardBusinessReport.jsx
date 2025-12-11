import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
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

const TrendIcon = ({ trend }) => {
  if (trend === "up")
    return <span className="text-blue-600 font-semibold text-xl">↗</span>;
  if (trend === "down")
    return <span className="text-blue-400 font-semibold text-xl">↘</span>;
  return <span className="text-gray-400 font-semibold text-xl">→</span>;
};

export default function DashboardBusinessReport({ dateRange }) {
  const [salesByLocation, setSalesByLocation] = useState([]);
  const [revenueVsExpenses, setRevenueVsExpenses] = useState([]);
  const [profitTrend, setProfitTrend] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [productPerformance, setProductPerformance] = useState([]);
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
          salesByLocationRes,
          revenueVsExpensesRes,
          profitTrendRes,
          paymentMethodsRes,
          productPerformanceRes,
          businessStatsRes,
        ] = await Promise.all([
          api(`/api/stats/key-metrics${queryString}`),
          api(`/api/stats/sales-by-location${queryString}`),
          api(`/api/stats/revenue-vs-expenses${queryString}`),
          api(`/api/stats/profit-trend${queryString}`),
          api(`/api/stats/payment-methods${queryString}`),
          api(`/api/stats/product-performance${queryString}`),
          api(`/api/stats/business-stats${queryString}`),
        ]);

        setKeyMetrics(keyMetricsRes || {});
        setSalesByLocation(salesByLocationRes || []);
        setRevenueVsExpenses(revenueVsExpensesRes || []);
        setProfitTrend(profitTrendRes || []);
        setPaymentMethods(paymentMethodsRes || []);
        setProductPerformance(productPerformanceRes || []);
        setBusinessStats(businessStatsRes || {});
      } catch (error) {
        console.error("Error fetching business report data:", error);
      }
    };

    fetchData();
  }, [dateRange]);

  return (
    <section className="w-full px-5 md:px-8 py-6 bg-gray-50">
      {/* Key Metrics */}
      {/* Charts Row 1: Sales by Location and Revenue vs Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 w-full min-h-[350px]">
        {/* Sales by Location */}
        <div className="bg-white rounded-lg p-6 border border-blue-300 shadow-lg">
          <h3 className="text-xl font-extrabold text-blue-700 mb-5 select-none">
            Sales by Location
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={salesByLocation}
              margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
              <XAxis
                dataKey="location"
                tick={{ fontSize: 13, fill: "#1e40af" }}
                padding={{ left: 10, right: 10 }}
              />
              <YAxis tick={{ fontSize: 13, fill: "#1e40af" }} />
              <Tooltip
                contentStyle={{
                  background: "#f0f9ff",
                  borderColor: "#3b82f6",
                  borderRadius: 10,
                  fontWeight: "600",
                }}
                labelStyle={{ fontWeight: "700", color: "#1e3a8a" }}
              />
              <Bar
                dataKey="sales"
                fill="#3b82f6"
                radius={[10, 10, 0, 0]}
                barSize={40}
                background={{ fill: "#c7d2fe" }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue vs Expenses */}
        <div className="bg-white rounded-lg p-6 border border-blue-300 shadow-lg">
          <h3 className="text-xl font-extrabold text-blue-700 mb-5 select-none">
            Revenue vs Expenses
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={revenueVsExpenses}
              margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 13, fill: "#1e40af" }}
                padding={{ left: 10, right: 10 }}
              />
              <YAxis tick={{ fontSize: 13, fill: "#1e40af" }} />
              <Tooltip
                contentStyle={{
                  background: "#f0f9ff",
                  borderColor: "#3b82f6",
                  borderRadius: 10,
                  fontWeight: "600",
                }}
                labelStyle={{ fontWeight: "700", color: "#1e3a8a" }}
              />
              <Legend
                verticalAlign="top"
                wrapperStyle={{ paddingBottom: 10 }}
              />
              <Bar
                dataKey="revenue"
                fill="#2563eb"
                radius={[10, 10, 0, 0]}
                barSize={32}
                background={{ fill: "#bfdbfe" }}
              />
              <Bar
                dataKey="expenses"
                fill="#93c5fd"
                radius={[10, 10, 0, 0]}
                barSize={32}
                background={{ fill: "#dbeafe" }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2: Profit Trend and Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 w-full min-h-[350px]">
        {/* Profit Trends */}
        <div className="bg-white rounded-lg p-6 border border-blue-300 shadow-lg">
          <h3 className="text-xl font-extrabold text-blue-700 mb-5 select-none">
            Profit Trends
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart
              data={profitTrend}
              margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 13, fill: "#1e40af" }}
                padding={{ left: 10, right: 10 }}
              />
              <YAxis tick={{ fontSize: 13, fill: "#1e40af" }} />
              <Tooltip
                contentStyle={{
                  background: "#f0f9ff",
                  borderColor: "#3b82f6",
                  borderRadius: 10,
                  fontWeight: "600",
                }}
                labelStyle={{ fontWeight: "700", color: "#1e3a8a" }}
              />
              <Line
                type="monotone"
                dataKey="profit"
                stroke="#2563eb"
                strokeWidth={3}
                dot={{ fill: "#2563eb", r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-lg p-6 border border-blue-300 shadow-lg">
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

      {/* Product Performance */}
      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-md mb-8 w-full">
        <h3 className="text-xl font-bold text-gray-800 mb-6 select-none">
          Product Performance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(() => {
            const maxSales = Math.max(
              ...productPerformance.map((p) => p.sales || 0)
            );
            return productPerformance.map((product) => {
              const progressPercent = maxSales
                ? Math.round((product.sales / maxSales) * 100)
                : 0;
              return (
                <div
                  key={product.name}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-150"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-gray-800 text-sm">
                      {product.name}
                    </span>
                    <TrendIcon trend={product.trend} />
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      role="progressbar"
                      aria-valuenow={progressPercent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`Sales progress for ${product.name}`}
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 font-semibold">
                    ₱{product.sales.toLocaleString()}
                  </p>
                </div>
              );
            });
          })()}
        </div>
      </div>
    </section>
  );
}
