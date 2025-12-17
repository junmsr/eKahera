import React, { useState, useEffect, useRef, useMemo } from "react";
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
import { BiRefresh, BiCalendarAlt, BiBell } from "react-icons/bi";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useAuth } from "../hooks/useAuth";
import DashboardBusinessReport from "../components/ui/Dashboard/DashboardBusinessReport";
import NotificationDropdown from "../components/common/NotificationDropdown";
import DateRangeFilterModal from "../components/modals/DateRangeFilterModal";

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

const MOCK_TOP_PRODUCTS = [
  { product_name: "Premium Coffee Bean", total_sold: 45 },
  { product_name: "Iced Latte", total_sold: 38 },
  { product_name: "Cappuccino", total_sold: 32 },
  { product_name: "Espresso", total_sold: 28 },
  { product_name: "Mocha", total_sold: 25 },
];

const MOCK_PAYMENT_METHODS = [
  { name: "Cash", value: 50, fill: "#3b82f6" },
  { name: "Gcash", value: 30, fill: "#1d4ed8" },
  { name: "Maya", value: 20, fill: "#1e40af" },
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

  // State
  const [stats, setStats] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: dayjs().startOf("month"),
    endDate: dayjs().endOf("day"),
    rangeType: "Month",
  });
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = React.useRef(null);
  const { logout } = useAuth();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [todayHighlight, setTodayHighlight] = useState({
    sales: 0,
    transactions: 0,
    topProduct: "-",
    totalItemsSold: 0,
    averageTransactionValue: 0,
  });
  const [exportingPDF, setExportingPDF] = useState(false);
  const [currentTime, setCurrentTime] = useState(dayjs());

  // Refs for PDF export
  const dashboardRef = useRef(null);
  const visitorsChartRef = useRef(null);
  const pieChartRef = useRef(null);
  const keyMetricsRef = useRef(null);
  const businessReportRef = useRef(null);

  // Optimized timer: only update when page is visible and reduce frequency to every 10 seconds
  useEffect(() => {
    let timer;
    const updateTime = () => {
      if (document.visibilityState === "visible") {
        setCurrentTime(dayjs());
      }
    };

    // Update immediately
    updateTime();

    // Update every 10 seconds (instead of every second) and only when visible
    timer = setInterval(updateTime, 10000);

    // Also update when page becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        updateTime();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Close notification dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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

  const fetchNotifications = async () => {
    try {
      // Mock notifications for demo
      const mockNotifications = [
        {
          id: 1,
          title: "Demo Notification",
          message: "Demo User did an action: Sample Action",
          time: dayjs().format("MMM D, h:mm A"),
          isRead: false,
        },
      ];
      setNotifications(mockNotifications);
      setUnreadCount(mockNotifications.filter((n) => !n.isRead).length);
    } catch (e) {
      console.error("Failed to fetch notifications", e);
    }
  };

  const handleMarkAsRead = (id) => {
    setNotifications((notifs) =>
      notifs.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const handleDeleteNotification = (id) => {
    setNotifications((notifs) => notifs.filter((n) => n.id !== id));
    const notif = notifications.find((n) => n.id === id);
    if (notif && !notif.isRead) {
      setUnreadCount((c) => Math.max(0, c - 1));
    }
  };

  const handleMarkAsUnread = (id) => {
    setNotifications((notifs) =>
      notifs.map((n) => (n.id === id ? { ...n, isRead: false } : n))
    );
    setUnreadCount((c) => c + 1);
  };

  // Fetch filtered data when dateRange changes
  useEffect(() => {
    fetchData();
    fetchNotifications();
  }, [dateRange]);

  // Helper function to format currency values
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // New handler to receive selected dates from modal
  const handleDateRangeApply = (newRange) => {
    setDateRange(newRange);
  };

  const headerDateDisplay = useMemo(() => {
    if (!dateRange.startDate || !dateRange.endDate) return "Select Range";

    const finalStart = dayjs.min(dateRange.startDate, dateRange.endDate);
    const finalEnd = dayjs.max(dateRange.startDate, dateRange.endDate);

    return `${finalStart.format("MMM D")} - ${finalEnd.format("MMM D, YYYY")}`;
  }, [dateRange]);

  // Header actions - REMOVED SELECT DROPDOWN
  const headerActions = (
    <div className="flex items-center gap-2">
      <button
        onClick={fetchData}
        disabled={loading}
        title="Refresh Data"
        className="bg-white/80 backdrop-blur-sm hover:bg-white text-gray-700 p-1.5 sm:p-2 rounded-lg border border-gray-200/80 text-sm font-medium transition-all duration-200 hover:shadow-md hover:scale-[1.02] shrink-0"
      >
        <BiRefresh
          className={`w-4 h-4 sm:w-5 sm:h-5 ${loading ? "animate-spin" : ""}`}
        />
      </button>

      {/* NEW CALENDAR BUTTON */}
      <button
        onClick={() => setShowFilterModal(true)}
        disabled={loading}
        title="Select Date Range"
        className="flex items-center gap-1 sm:gap-2 bg-white/80 backdrop-blur-sm hover:bg-white text-gray-700 px-1.5 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-gray-200/80 text-xs sm:text-sm font-medium transition-all duration-200 outline-none cursor-pointer hover:shadow-md hover:scale-[1.02] shrink-0"
      >
        <BiCalendarAlt className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="hidden sm:inline">{headerDateDisplay}</span>
      </button>

      <div className="py-2 flex justify-end gap-2">
        <Button
          onClick={() => {}}
          disabled={exportingPDF || loading}
          size="sm"
          variant="primary"
          className="flex items-center gap-2 w-full sm:w-auto shrink-0"
        >
          {exportingPDF ? (
            <>
              <BiRefresh className="w-5 h-5 animate-spin" />
              <span className="hidden sm:inline">Exporting...</span>
              <span className="sm:hidden">...</span>
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
              <span className="hidden sm:inline">Export PDF</span>
              <span className="sm:hidden">PDF</span>
            </>
          )}
        </Button>
      </div>

      <div className="relative" ref={notificationRef}>
        <NotificationDropdown
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkAsRead={handleMarkAsRead}
          onMarkAsUnread={handleMarkAsUnread}
          onDelete={handleDeleteNotification}
          isOpen={showNotifications}
          onToggle={() => setShowNotifications(!showNotifications)}
          containerRef={notificationRef}
        />
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
                <DashboardBusinessReport
                  keyMetrics={keyMetrics}
                  formatCurrency={formatCurrency}
                  dateRange={dateRange}
                  currentTime={currentTime}
                  topProducts={MOCK_TOP_PRODUCTS}
                  paymentMethods={MOCK_PAYMENT_METHODS}
                />
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

      {/* Date Range Filter Modal */}
      {showFilterModal && (
        <DateRangeFilterModal
          isOpen={showFilterModal}
          onClose={() => setShowFilterModal(false)}
          onApply={handleDateRangeApply}
          initialRange={dateRange}
        />
      )}
    </PageLayout>
  );
}
