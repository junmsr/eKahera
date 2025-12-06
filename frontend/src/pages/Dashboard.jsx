import React, { useState, useEffect, useMemo } from "react";
import { api, authHeaders } from "../lib/api";
import dayjs from "dayjs"; 
import minMax from "dayjs/plugin/minMax"; 

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import { useAuth } from "../hooks/useAuth";

// Components
import PageLayout from "../components/layout/PageLayout";
import NavAdmin from "../components/layout/Nav-Admin";
import ChartCard from "../components/ui/Dashboard/ChartCard";
import DashboardStatsCard from "../components/ui/Dashboard/DashboardStatsCard";
import DashboardBusinessReport from "../components/ui/Dashboard/DashboardBusinessReport";
import Button from "../components/common/Button";
import { BiBell, BiUser, BiRefresh, BiCalendarAlt } from "react-icons/bi";
import ProfileModal from "../components/modals/ProfileModal";
import NotificationDropdown from "../components/common/NotificationDropdown";
import DateRangeFilterModal from "../components/modals/DateRangeFilterModal";

// Extend the minMax plugin globally for this file
dayjs.extend(minMax);


// Constants
const BLUE_COLORS = ["#2563eb", "#60a5fa", "#93c5fd", "#dbeafe"]; // Blue shades

const SOFT_BLUE = "#3b82f6"; // Tailwind blue-500/600 for lines/accents
const SOFT_GREEN = "#10b981"; // Retain green for profit, or change to a blue accent if desired
const SOFT_PURPLE = "#8b5cf6"; // Retain purple/accent for pie chart variation
const TODAY_START = dayjs().startOf('day');
const TODAY_END = dayjs().endOf('day');

function VisitorsChart({ data, className = "", rangeType = "Custom" }) {
  const getChartTitle = (rangeType) => {
    switch (rangeType) {
      case "Day":
        return "Visitors Today";
      case "Week":
        return "Visitors for the last 7 days";
      case "Month":
        return "Visitors this Month";
      case "Custom":
      default:
        return "Visitors for the selected range";
    }
  };

  return (
    <ChartCard
      title={<span className="text-blue-700">{getChartTitle(rangeType)}</span>}
      className={`bg-white/80 backdrop-blur-md border border-white/60 shadow-xl ${className}`}
    >
      <div className="h-72 w-full">
        {" "}
        {/* Ensure width is 100% for full responsiveness */}
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 20, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" tick={{ fill: "#374151", fontSize: 14 }} />
            <YAxis tick={{ fill: "#374151", fontSize: 14 }} />
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
              stroke={SOFT_BLUE} // Uses SOFT_BLUE constant
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
      title={<span className="text-blue-700">Sales by Product Category</span>}
      className={`bg-white/80 backdrop-blur-md border border-white/60 shadow-xl ${className}`}
    >
      <div className="h-72 w-full">
        {" "}
        {/* Ensure width is 100% for full responsiveness */}
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="percent"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={(entry) =>
                `${entry.name} (${Number(entry.percent || 0).toFixed(1)}%)`
              }
              fill={SOFT_PURPLE}
            >
              {data.map((entry, idx) => {
                const colors = [SOFT_BLUE, SOFT_GREEN, SOFT_PURPLE]; // Using blue theme colors
                return (
                  <Cell
                    key={`cell-${idx}`}
                    fill={colors[idx % colors.length]}
                  />
                );
              })}
            </Pie>
            <Legend />
            <Tooltip
              formatter={(value, name, props) => [
                `${Number(value).toFixed(1)}%`,
                props?.payload?.name,
              ]}
              contentStyle={{
                background: "#fafafa",
                borderColor: SOFT_PURPLE,
                borderRadius: 8,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

// Main Dashboard Component
export default function Dashboard() {
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
  const [showProfileModal, setShowProfileModal] = useState(false);
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

  // Fetch Today's data (independent of the main filter)
  useEffect(() => {
    const fetchTodayData = async () => {
      try {
        const token = sessionStorage.getItem("auth_token");
        const todayStr = dayjs().format("YYYY-MM-DD");

        const overview = await api("/api/dashboard/overview", {
          headers: authHeaders(token),
          params: { startDate: todayStr, endDate: todayStr },
        });

        if (overview) {
          setTodayHighlight({
            sales: overview.totalSales || 0,
            transactions: overview.totalTransactions || 0,
            totalItemsSold: overview.totalItemsSold || 0,
            averageTransactionValue: overview.averageTransactionValue || 0,
            topProduct: overview.topProducts?.[0]?.product_name || "-",
          });
        }
      } catch (err) {
        console.error("Failed to fetch today's data", err);
      }
    };
    fetchTodayData();
  }, []);

  const user = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem("user") || "{}");
    } catch (e) {
      return {};
    }
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

  // Data fetching
  const fetchData = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem("auth_token");

      const { startDate, endDate, rangeType } = dateRange;

      const formatDate = (date) => dayjs(date).format("YYYY-MM-DD");

      const finalStart = dayjs.min(startDate, endDate);
      const finalEnd = dayjs.max(startDate, endDate);

      const startDateStr = formatDate(finalStart);
      const endDateStr = formatDate(finalEnd);

      console.log("Fetching data for date range:", {
        rangeType,
        formattedStart: startDateStr,
        formattedEnd: endDateStr,
      });

      const [overview, timeseries, pie, oldLowStock] = await Promise.all([
        api("/api/dashboard/overview", {
          headers: authHeaders(token),
          params: {
            startDate: startDateStr,
            endDate: endDateStr,
          },
        }),
        api(`/api/stats/customers-timeseries`, {
          headers: authHeaders(token),
          params: {
            startDate: startDateStr,
            endDate: endDateStr,
          },
        }),
        api("/api/stats/sales-by-category", {
          headers: authHeaders(token),
          params: {
            startDate: startDateStr,
            endDate: endDateStr,
          },
        }),
        api("/api/products/low-stock", { headers: authHeaders(token) }),
      ]);

      const derived = (timeseries || []).map((d) => ({
        ...d,
        name: d.date || d.name,
        value: Number(d.customers || d.total || d.value || 0),
      }));

      const pieTotal =
        (pie || []).reduce((s, p) => s + Number(p.value || 0), 0) || 1;
      const piePercent = (pie || []).map((p) => ({
        ...p,
        percent: (Number(p.value || 0) / pieTotal) * 100,
      }));

      if (overview) {
        const revenue = Number(overview.totalSales || 0);
        const expenses = Number(overview.totalExpenses || 0);
        const netProfit = revenue - expenses;
        const grossMargin = revenue > 0 ? ((revenue - expenses) / revenue) * 100 : 0;
        const totalTransactions = Number(overview.totalTransactions || 0);
        const totalItemsSold = Number(overview.totalItemsSold || 0);
        const avgTxValue = Number(
          overview.averageTransactionValue || revenue / (totalTransactions || 1)
        );
        const topProduct = overview.topProducts?.[0]?.product_name || "-";

        setKeyMetrics({
          revenue,
          expenses,
          netProfit,
          grossMargin,
          totalTransactions,
          totalItemsSold,
          averageTransactionValue: avgTxValue,
        });

        const dateRangeText = 
            rangeType === "Day" 
                ? finalStart.format("MMM D, YYYY")
                : `${finalStart.format("MMM D")} - ${finalEnd.format("MMM D, YYYY")}`;
        
        const salesLabel = rangeType === 'Day' ? "Daily Sales" : rangeType === 'Week' ? "7-Day Sales" : rangeType === 'Month' ? "Monthly Sales" : "Total Sales";
        const transactionsLabel = rangeType === 'Day' ? "Daily Transactions" : rangeType === 'Week' ? "7-Day Transactions" : rangeType === 'Month' ? "Monthly Transactions" : "Total Transactions";


        setStats([
          {
            label: salesLabel,
            value: `₱${revenue.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`,
            subtext: dateRangeText,
          },
          {
            label: transactionsLabel,
            value: totalTransactions,
            subtext: `${dateRangeText}`,
          },
          {
            label: "Top Product",
            value: topProduct,
            subtext: `Total: ${overview.topProducts?.[0]?.total_sold || 0} sold`,
          },
          {
            label: "Items Sold",
            value: totalItemsSold,
            subtext: `${totalTransactions} transactions`,
          },
        ]);
      }

      setChartData(derived);
      setPieData(piePercent);

      const lowStock = oldLowStock || [];
      setLowStockProducts(lowStock);
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    // ... (Notification fetching logic remains the same)
    try {
      const token = sessionStorage.getItem("auth_token");
      const resp = await api("/api/logs", { headers: authHeaders(token) });
      const readIds = new Set(
        JSON.parse(sessionStorage.getItem("read_notif_ids") || "[]")
      );
      const deletedIds = new Set(
        JSON.parse(sessionStorage.getItem("deleted_notif_ids") || "[]")
      );
      const mapped = (resp || [])
        .filter((log) => !deletedIds.has(log.log_id))
        .map((log) => ({
          id: log.log_id,
          title: log.action,
          message: `${log.username} (${log.role}) did an action: ${log.action}`,
          time: dayjs(log.date_time).format('MMM D, h:mm A'),
          isRead: readIds.has(log.log_id),
        }));
      setNotifications(mapped);
      setUnreadCount(mapped.filter((n) => !n.isRead).length);
    } catch (e) {
      console.error("Failed to fetch notifications", e);
    }
  };

  const handleMarkAsRead = (id) => {
    // ... (Notification handling logic remains the same)
    const readIds = JSON.parse(
      sessionStorage.getItem("read_notif_ids") || "[]"
    );
    if (!readIds.includes(id)) {
      sessionStorage.setItem(
        "read_notif_ids",
        JSON.stringify([...readIds, id])
      );
    }
    setNotifications((notifs) =>
      notifs.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const handleDeleteNotification = (id) => {
    // ... (Notification handling logic remains the same)
    const deletedIds = JSON.parse(
      sessionStorage.getItem("deleted_notif_ids") || "[]"
    );
    sessionStorage.setItem(
      "deleted_notif_ids",
      JSON.stringify([...deletedIds, id])
    );
    setNotifications((notifs) => notifs.filter((n) => n.id !== id));
    const notif = notifications.find((n) => n.id === id);
    if (notif && !notif.isRead) {
      setUnreadCount((c) => Math.max(0, c - 1));
    }
  };
  
  const handleMarkAsUnread = (id) => {
    // ... (Notification handling logic remains the same)
    const readIds = JSON.parse(
      sessionStorage.getItem("read_notif_ids") || "[]"
    );
    const filtered = readIds.filter((rid) => rid !== id);
    sessionStorage.setItem("read_notif_ids", JSON.stringify(filtered));
    setNotifications((notifs) =>
      notifs.map((n) => (n.id === id ? { ...n, isRead: false } : n))
    );
    setUnreadCount((c) => c + 1);
  };
  
  // Export to CSV
  const exportToCSV = () => {
    // ... (Export logic remains the same)
    const headers = ["Label", "Value", "Change"];
    const rows = stats.map((s) => [s.label, s.value, s.change || "-"]);
    // Add low stock products
    if (lowStockProducts.length > 0) {
      rows.push(["", "", ""]); // separator
      rows.push(["Low Stock Products", "", ""]);
      rows.push(["Product Name", "Quantity Left", ""]);
      lowStockProducts.forEach((p) =>
        rows.push([p.product_name, p.quantity_in_stock, ""])
      );
    }
    const csvContent = [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "dashboard-data.csv";
    link.click();
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
        <span className="hidden sm:inline">
            {headerDateDisplay}
        </span>
      </button>

      {/* Adjusted Export Button container for better mobile spacing */}
      <div className="py-2 flex justify-end">
        <Button
          onClick={exportToCSV}
          size="sm"
          variant="secondary"
          className="flex items-center gap-2 w-full sm:w-auto shrink-0"
        >
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
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span className="hidden sm:inline">Export</span>
          <span className="sm:hidden">Export</span>
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

      <button
        onClick={() => setShowProfileModal(true)}
        className="flex items-center gap-1 sm:gap-2 bg-white/80 backdrop-blur-sm p-1 sm:p-1.5 sm:px-2 sm:py-2 rounded-lg border border-gray-200/80 hover:bg-white transition-all duration-200 hover:shadow-md hover:scale-[1.02] shrink-0"
      >
        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full flex items-center justify-center text-sm font-medium shadow-lg">
          {user.username?.[0]?.toUpperCase() || "A"}
        </div>
        <span className="text-sm font-medium text-gray-700 hidden sm:inline">
          {user.username || "Admin"}
        </span>
      </button>
    </div>
  );

  return (
    <PageLayout
      title="DASHBOARD"
      subtitle=""
      sidebar={<NavAdmin />}
      headerActions={headerActions}
      isSidebarOpen={isSidebarOpen}
      setSidebarOpen={setSidebarOpen}
      className="bg-gray-50 min-h-screen"
    >
      {/* Low Stock Products - Mobile View (Added padding class p-6-safe) */}
      <div className="p-4 lg:hidden">
        {loading ? (
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-6"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
            <div className="h-4 bg-gray-200 rounded w-4/5"></div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">
                Low Stock Products
              </h3>
            </div>
            <LowStockList lowStockProducts={lowStockProducts} />
          </div>
        )}
      </div>

      {/* Key Metrics Cards - Optimized for all screens */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 w-full px-4 sm:px-6 md:px-8 py-2">
        {/* Card 1: Total Revenue */}
        <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
          <p className="text-xs font-medium text-gray-500 uppercase mb-1">
            Total Revenue
          </p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(keyMetrics.revenue)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            For selected range
          </p>
        </div>
        {/* Card 2: Operating Expenses */}
        <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
          <p className="text-xs font-medium text-gray-500 uppercase mb-1">
            Operating Expenses
          </p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(keyMetrics.expenses)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            For selected range
          </p>
        </div>
        {/* Card 3: Net Profit */}
        <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
          <p className="text-xs font-medium text-gray-500 uppercase mb-1">
            Net Profit
          </p>
          <p
            className={`text-2xl font-bold ${
              keyMetrics.netProfit >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {formatCurrency(Math.abs(keyMetrics.netProfit))}
            {keyMetrics.netProfit < 0 && (
              <span className="text-sm text-red-500 ml-1">(Loss)</span>
            )}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            For selected range
          </p>
        </div>
        {/* Card 4: Gross Margin */}
        <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
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
          <p className="text-xs text-gray-500 mt-1">
            For selected range
          </p>
        </div>
      </div>

      {/* Main Content Area - Optimized for large screen side-by-side layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 sm:p-6 md:p-8 pt-0">
        {/* Main Chart Area (8/12 width on large screens) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {loading ? (
            <>
              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 h-[336px] animate-pulse flex items-center justify-center">
                <div className="w-full h-64 bg-gray-200 rounded-lg"></div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 h-[336px] animate-pulse flex items-center justify-center">
                <div className="w-64 h-64 bg-gray-200 rounded-full"></div>
              </div>
            </>
          ) : (
            <>
              <VisitorsChart data={chartData} rangeType={dateRange.rangeType} />
              <SalesPieChart data={pieData} />
            </>
          )}
        </div>

        {/* Sidebar with Stats and Low Stock (4/12 width on large screens) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {loading ? (
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-8 bg-gray-300 rounded w-1/2 mb-6"></div>
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-8 bg-gray-300 rounded w-1/2 mb-6"></div>
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-8 bg-gray-300 rounded w-1/2"></div>
            </div>
          ) : (
            <DashboardStatsCard 
                stats={todayHighlight}
                formatCurrency={formatCurrency}
                rangeType="Today" // Explicitly label this card as "Today's" stats
            />
          )}

          {/* Low Stock Products - Desktop View */}
          {loading ? (
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 animate-pulse hidden lg:block">
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-6"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-4/5"></div>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-lg shadow-md hidden lg:block">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">
                  Low Stock Products
                </h3>
              </div>
              <LowStockList lowStockProducts={lowStockProducts} />
            </div>
          )}
        </div>
      </div>

      {/* Business Report Component - Ensure it uses the full content width */}
      <div className="w-full px-4 sm:px-6 md:px-8 pb-8">
        <DashboardBusinessReport />
      </div>

      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        userData={user}
      />
      
      {/* NEW DATE RANGE FILTER MODAL */}
      <DateRangeFilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onDateRangeApply={handleDateRangeApply}
      />
    </PageLayout>
  );
}

// LowStockList is kept as a separate component for clean code, as in the original
function LowStockList({ lowStockProducts }) {
    if (lowStockProducts.length === 0) {
      return <p className="text-sm text-gray-500">No products with low stock.</p>;
    }
  
    return (
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
    );
  }