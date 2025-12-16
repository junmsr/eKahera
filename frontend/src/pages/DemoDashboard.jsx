import React, { useState, useEffect, useRef } from "react";
import dayjs from "dayjs";
import minMax from "dayjs/plugin/minMax";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  ResponsiveContainer,
  Legend,
} from "recharts";

// Components
import PageLayout from "../components/layout/PageLayout";
import DemoNav from "../components/layout/DemoNav";
import ChartCard from "../components/ui/Dashboard/ChartCard";
import DashboardStatsCard from "../components/ui/Dashboard/DashboardStatsCard";
import Button from "../components/common/Button";
import { BiRefresh, BiCalendarAlt } from "react-icons/bi";

dayjs.extend(minMax);

const SOFT_BLUE = "#3b82f6";
const SOFT_PURPLE = "#8b5cf6";

// Mock Data
const MOCK_OVERVIEW = {
  totalSales: 25430.5,
  totalExpenses: 8500.0,
  totalTransactions: 142,
  totalItemsSold: 356,
  averageTransactionValue: 179.08,
  topProducts: [{ product_name: "Premium Coffee Bean", total_sold: 45 }],
};

const MOCK_TIMESERIES = [
  { name: "2023-10-01", value: 12 },
  { name: "2023-10-02", value: 19 },
  { name: "2023-10-03", value: 15 },
  { name: "2023-10-04", value: 25 },
  { name: "2023-10-05", value: 32 },
  { name: "2023-10-06", value: 28 },
  { name: "2023-10-07", value: 40 },
];

const MOCK_PIE = [
  { name: "Beverages", value: 4500 },
  { name: "Snacks", value: 3200 },
  { name: "Meals", value: 8900 },
  { name: "Desserts", value: 2100 },
];

const MOCK_LOW_STOCK = [
  { product_id: 1, product_name: "Vanilla Syrup", quantity_in_stock: 3 },
  { product_id: 2, product_name: "Paper Cups (L)", quantity_in_stock: 15 },
];

function VisitorsChart({ data, className = "" }) {
  return (
    <ChartCard
      title={
        <span className="text-blue-700">Customer Transactions (Demo)</span>
      }
      className={`bg-white/80 backdrop-blur-md border border-white/60 shadow-xl ${className}`}
    >
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 20, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" tick={{ fill: "#374151", fontSize: 10 }} />
            <YAxis tick={{ fill: "#374151", fontSize: 10 }} />
            <Tooltip
              contentStyle={{
                background: "#fff",
                borderColor: "#e5e7eb",
                borderRadius: 8,
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={SOFT_BLUE}
              strokeWidth={3}
              dot={{ r: 5, fill: SOFT_BLUE }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

function SalesPieChart({ data, className = "" }) {
  return (
    <ChartCard
      title={<span className="text-blue-700">Sales by Category (Demo)</span>}
      className={`bg-white/80 backdrop-blur-md border border-white/60 shadow-xl ${className}`}
    >
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" tick={{ fill: "#374151", fontSize: 12 }} />
            <YAxis tick={{ fill: "#374151", fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                background: "#fafafa",
                borderColor: SOFT_PURPLE,
                borderRadius: 8,
              }}
            />
            <Legend />
            <Bar dataKey="value" fill={SOFT_BLUE} radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

export default function DemoDashboard() {
  const [keyMetrics, setKeyMetrics] = useState({
    revenue: 0,
    expenses: 0,
    netProfit: 0,
    grossMargin: 0,
    totalTransactions: 0,
    totalItemsSold: 0,
    averageTransactionValue: 0,
  });

  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [todayHighlight, setTodayHighlight] = useState({
    sales: 0,
    transactions: 0,
    topProduct: "-",
    totalItemsSold: 0,
    averageTransactionValue: 0,
  });
  const [currentTime, setCurrentTime] = useState(dayjs());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(dayjs()), 10000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Set Mock Data
    const overview = MOCK_OVERVIEW;
    const revenue = overview.totalSales;
    const expenses = overview.totalExpenses;
    const netProfit = revenue - expenses;
    const grossMargin =
      revenue > 0 ? ((revenue - expenses) / revenue) * 100 : 0;

    setKeyMetrics({
      revenue,
      expenses,
      netProfit,
      grossMargin,
      totalTransactions: overview.totalTransactions,
      totalItemsSold: overview.totalItemsSold,
      averageTransactionValue: overview.averageTransactionValue,
    });

    setTodayHighlight({
      sales: 1250.0,
      transactions: 15,
      totalItemsSold: 42,
      averageTransactionValue: 83.33,
      topProduct: "Iced Latte",
    });

    setChartData(MOCK_TIMESERIES);
    setPieData(MOCK_PIE);
    setLowStockProducts(MOCK_LOW_STOCK);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const headerActions = (
    <div className="flex items-center gap-2">
      <button
        onClick={fetchData}
        disabled={loading}
        title="Refresh Data"
        className="bg-white/80 backdrop-blur-sm hover:bg-white text-gray-700 p-2 rounded-lg border border-gray-200/80"
      >
        <BiRefresh className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
      </button>
      <div className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-100">
        Demo Mode
      </div>
    </div>
  );

  return (
    <PageLayout
      title="DASHBOARD (DEMO)"
      subtitle=""
      sidebar={<DemoNav />}
      headerActions={headerActions}
      isSidebarOpen={isSidebarOpen}
      setSidebarOpen={setSidebarOpen}
      className="bg-gray-50 min-h-screen"
    >
      <div className="p-4 sm:p-6 md:p-8">
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 w-full mb-6">
          <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">
              Total Revenue
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(keyMetrics.revenue)}
            </p>
          </div>
          <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">
              Operating Expenses
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(keyMetrics.expenses)}
            </p>
          </div>
          <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">
              Net Profit
            </p>
            <p
              className={`text-2xl font-bold ${
                keyMetrics.netProfit >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {formatCurrency(Math.abs(keyMetrics.netProfit))}
            </p>
          </div>
          <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">
              Gross Margin
            </p>
            <p
              className={`text-2xl font-bold ${
                keyMetrics.grossMargin >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {keyMetrics.grossMargin.toFixed(1)}%
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Chart Area */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {loading ? (
              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 h-64 animate-pulse"></div>
            ) : (
              <>
                <VisitorsChart data={chartData} />
                <SalesPieChart data={pieData} />
              </>
            )}
          </div>

          {/* Sidebar Stats */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <DashboardStatsCard
              stats={todayHighlight}
              formatCurrency={formatCurrency}
              rangeType="Today"
              currentTime={currentTime}
            />

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                Low Stock Products
              </h3>
              <ul className="divide-y divide-gray-200">
                <li className="py-2 text-sm font-semibold text-gray-600 flex justify-between">
                  <span>Product</span>
                  <span>Quantity</span>
                </li>
                {lowStockProducts.map((product) => (
                  <li
                    key={product.product_id}
                    className="py-3 flex justify-between items-center"
                  >
                    <span className="text-sm font-medium text-gray-800">
                      {product.product_name}
                    </span>
                    <span className="text-sm font-bold text-red-600">
                      {product.quantity_in_stock} left
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
