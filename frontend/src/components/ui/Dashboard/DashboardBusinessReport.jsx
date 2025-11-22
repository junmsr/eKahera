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
    return <span className="text-green-600 font-bold">↗</span>;
  if (trend === "down")
    return <span className="text-red-600 font-bold">↘</span>;
  return <span className="text-gray-400 font-bold">→</span>;
};

export default function DashboardBusinessReport() {
  const [keyMetrics, setKeyMetrics] = useState({ revenue: 0, expenses: 0, netProfit: 0, grossMargin: 0 });
  const [salesByLocation, setSalesByLocation] = useState([]);
  const [revenueVsExpenses, setRevenueVsExpenses] = useState([]);
  const [profitTrend, setProfitTrend] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [productPerformance, setProductPerformance] = useState([]);
  const [businessStats, setBusinessStats] = useState({ cashFlow: 0, operatingCosts: 0, profitGrowth: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [keyMetricsRes, salesByLocationRes, revenueVsExpensesRes, profitTrendRes, paymentMethodsRes, productPerformanceRes, businessStatsRes] = await Promise.all([
          api('/api/stats/key-metrics'),
          api('/api/stats/sales-by-location'),
          api('/api/stats/revenue-vs-expenses'),
          api('/api/stats/profit-trend'),
          api('/api/stats/payment-methods'),
          api('/api/stats/product-performance'),
          api('/api/stats/business-stats')
        ]);

        setKeyMetrics(keyMetricsRes || {});
        setSalesByLocation(salesByLocationRes || []);
        setRevenueVsExpenses(revenueVsExpensesRes || []);
        setProfitTrend(profitTrendRes || []);
        setPaymentMethods(paymentMethodsRes || []);
        setProductPerformance(productPerformanceRes || []);
        setBusinessStats(businessStatsRes || {});
      } catch (error) {
        console.error('Error fetching business report data:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <section className="w-full">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 w-full">
        <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase mb-1">
            Total Revenue
          </p>
          <p className="text-2xl font-bold text-gray-900">
            ₱{keyMetrics.revenue.toLocaleString()}
          </p>
          <p className="text-xs text-green-600 mt-2">↗ +11.2%</p>
        </div>
        <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase mb-1">
            Operating Expenses
          </p>
          <p className="text-2xl font-bold text-gray-900">
            ₱{keyMetrics.expenses.toLocaleString()}
          </p>
          <p className="text-xs text-orange-600 mt-2">↗ +8.5%</p>
        </div>
        <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase mb-1">
            Net Profit
          </p>
          <p className="text-2xl font-bold text-gray-900">
            ₱{keyMetrics.netProfit.toLocaleString()}
          </p>
          <p className="text-xs text-green-600 mt-2">↗ +13.5%</p>
        </div>
        <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase mb-1">
            Gross Margin
          </p>
          <p className="text-2xl font-bold text-gray-900">
            {keyMetrics.grossMargin}%
          </p>
          <p className="text-xs text-green-600 mt-2">↗ +2.1%</p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 w-full">
        {/* Sales by Location */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Sales by Location
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={salesByLocation}
              margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="location" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="sales" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue vs Expenses */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Revenue vs Expenses
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={revenueVsExpenses}
              margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" fill="#10b981" radius={[8, 8, 0, 0]} />
              <Bar dataKey="expenses" fill="#ef4444" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 w-full">
        {/* Profit Trend */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Profit Trends
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart
              data={profitTrend}
              margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="profit"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={{ fill: "#8b5cf6", r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Payment Methods
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
              <Pie
                data={paymentMethods}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name} ${value}%`}
                outerRadius={70}
                fill="#8884d8"
                dataKey="value"
              >
                {paymentMethods.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Product Performance */}
      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm mb-6 w-full">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          Product Performance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {productPerformance.map((product) => (
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
                  className="bg-blue-600 h-2 rounded-full"
                  style={{
                    width: `${Math.round((product.sales / 30000) * 100)}%`,
                  }}
                ></div>
              </div>
              <p className="text-xs text-gray-600">
                ₱{product.sales.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
          <p className="text-xs font-medium text-green-700 uppercase mb-1">
            Cash Flow
          </p>
          <p className="text-2xl font-bold text-green-900">
            ₱{businessStats.cashFlow.toLocaleString()}
          </p>
          <p className="text-xs text-green-700 mt-2">Positive this month</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
          <p className="text-xs font-medium text-blue-700 uppercase mb-1">
            Operating Costs
          </p>
          <p className="text-2xl font-bold text-blue-900">
            ₱{businessStats.operatingCosts.toLocaleString()}
          </p>
          <p className="text-xs text-blue-700 mt-2">Controlled & optimized</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
          <p className="text-xs font-medium text-purple-700 uppercase mb-1">
            Profit Growth
          </p>
          <p className="text-2xl font-bold text-purple-900">
            +{businessStats.profitGrowth}%
          </p>
          <p className="text-xs text-purple-700 mt-2">vs. previous month</p>
        </div>
      </div>
    </section>
  );
}
