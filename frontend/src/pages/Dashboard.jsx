import React, { useState, useEffect, useMemo } from "react";
import { api, authHeaders } from "../lib/api";
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
import StatsCard from "../components/ui/Dashboard/StatsCard";
import ChartCard from "../components/ui/Dashboard/ChartCard";
import DashboardStatsCard from "../components/ui/Dashboard/DashboardStatsCard";
import DashboardBusinessReport from "../components/ui/Dashboard/DashboardBusinessReport";
import Button from "../components/common/Button";
import { BiBell, BiUser, BiRefresh } from "react-icons/bi";
import ProfileModal from "../components/modals/ProfileModal";
import NotificationDropdown from "../components/common/NotificationDropdown";

// Constants
const BLUE_COLORS = ["#2563eb", "#60a5fa", "#93c5fd", "#dbeafe"];

const SOFT_BLUE = "#93c5fd";
const SOFT_GREEN = "#1e2cecff";
const SOFT_PURPLE = "#3e209bff";

function VisitorsChart({ data, className = "" }) {
  return (
    <ChartCard
      title={
        <span className="text-blue-700">Visitors for the last 6 months</span>
      }
      className={`bg-white/80 backdrop-blur-md border border-white/60 shadow-xl ${className}`}
    >
      <div className="h-72">
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
      title={<span className="text-blue-700">Sales by Product Category</span>}
      className={`bg-white/80 backdrop-blur-md border border-white/60 shadow-xl ${className}`}
    >
      <div className="h-72">
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
                const colors = [SOFT_BLUE, SOFT_GREEN, SOFT_PURPLE];
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
  // State
  const [stats, setStats] = useState([]);
  const [range, setRange] = useState("month");
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [highlight, setHighlight] = useState({
    sales: 0,
    transactions: 0,
    topProduct: "-",
  });
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = React.useRef(null);
  const { logout } = useAuth();
  const [isSidebarOpen, setSidebarOpen] = useState(false);

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
      // Prefer the view-backed dashboard endpoints we added
      const [overview, timeseries, pie, inventoryMovement, oldLowStock] =
        await Promise.all([
          api('/api/dashboard/overview', { headers: authHeaders(token) }),
          api(
            `/api/stats/customers-timeseries?days=${
              range === 'week' ? 7 : range === 'month' ? 30 : range === 'year' ? 365 : 180
            }`,
            { headers: authHeaders(token) }
          ),
          api('/api/stats/sales-by-category', { headers: authHeaders(token) }),
          api('/api/dashboard/inventory-movement', { headers: authHeaders(token) }),
          api('/api/products/low-stock', { headers: authHeaders(token) }),
        ]);

      const derived = (timeseries || []).map((d) => ({
        ...d,
        value: Number(d.customers || d.total || d.value || 0),
      }));

      // Build pie data (categories) based on existing stats endpoint or overview
      const pieTotal = (pie || []).reduce((s, p) => s + Number(p.value || 0), 0) || 1;
      const piePercent = (pie || []).map((p) => ({
        ...p,
        percent: (Number(p.value || 0) / pieTotal) * 100,
      }));

      // If overview is available use it for KPIs
      if (overview && overview.totalSales !== undefined) {
        setStats([
          { label: 'Total Revenue', value: overview.totalSales, change: 0 },
          { label: 'Total Transactions', value: overview.totalTransactions, change: 0 },
          { label: 'Total Items Sold', value: overview.totalItemsSold, change: 0 },
          { label: 'Avg TX Value', value: overview.averageTransactionValue, change: 0 },
        ]);
        setHighlight({
          sales: Number(overview.totalSales || 0),
          transactions: Number(overview.totalTransactions || 0),
          totalItemsSold: Number(overview.totalItemsSold || 0),
          averageTransactionValue: Number(overview.averageTransactionValue || 0),
          topProduct:
            (overview.topProducts && overview.topProducts[0]?.product_name) ||
            (piePercent[0]?.name || '-'),
        });
      }

      setChartData(derived);
      setPieData(piePercent);

      // Prefer inventoryMovement for low stock list (fallback to old endpoint)
      const low = (inventoryMovement || []).filter(
        (p) => Number(p.quantity_in_stock || 0) <= 10
      );
      setLowStockProducts(low.length ? low : oldLowStock || []);
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
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
          time: new Date(log.date_time).toLocaleString(),
          isRead: readIds.has(log.log_id),
        }));
      setNotifications(mapped);
      setUnreadCount(mapped.filter((n) => !n.isRead).length);
    } catch (e) {
      console.error("Failed to fetch notifications", e);
    }
  };

  const handleMarkAsRead = (id) => {
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

  const handleMarkAsUnread = (id) => {
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

  const handleDeleteNotification = (id) => {
    const deletedIds = JSON.parse(
      sessionStorage.getItem("deleted_notif_ids") || "[]"
    );
    sessionStorage.setItem(
      "deleted_notif_ids",
      JSON.stringify([...deletedIds, id])
    );
    setNotifications((notifs) => notifs.filter((n) => n.id !== id));
    // Update unread count if deleted notification was unread
    const notif = notifications.find((n) => n.id === id);
    if (notif && !notif.isRead) {
      setUnreadCount((c) => Math.max(0, c - 1));
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ["Label", "Value", "Change"];
    const rows = stats.map((s) => [s.label, s.value, s.change]);
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

  useEffect(() => {
    fetchData();
    fetchNotifications();
  }, [range]);

  const headerActions = (
    <div className="flex flex-nowrap items-center justify-end -gap-1 sm:gap-2 mr-3">
      <button
        onClick={fetchData}
        disabled={loading}
        title="Refresh Data"
        className="bg-white/80 backdrop-blur-sm hover:bg-white text-gray-700 p-1.5 sm:p-2 rounded-lg border border-gray-200/80 text-sm font-medium transition-all duration-200 hover:shadow-md hover:scale-[1.02]"
      >
        <BiRefresh className={`w-4 h-4 sm:w-5 sm:h-5 ${loading ? "animate-spin" : ""}`} />
      </button>

      <select
        className="bg-white/80 backdrop-blur-sm hover:bg-white text-gray-700 px-1.5 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-gray-200/80 text-xs sm:text-sm font-medium transition-all duration-200 outline-none cursor-pointer hover:shadow-md"
        value={range}
        onChange={(e) => setRange(e.target.value)}
        disabled={loading}
      >
        <option value="week">Week</option>
        <option value="month">Month</option>
        <option value="year">Year</option>
      </select>

      <div className="-mt-2 -mb-3 py-8 px-8 pr-12 flex justify-end">
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
        className="flex items-center gap-2 bg-white/80 backdrop-blur-sm p-1 sm:p-1.5 sm:px-3 sm:py-2 rounded-lg border border-gray-200/80 hover:bg-white transition-all duration-200 hover:shadow-md hover:scale-[1.02] -mr-1"
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
      sidebar={<NavAdmin onLogoutClick={logout} />}
      headerActions={headerActions}
      isSidebarOpen={isSidebarOpen}
      setSidebarOpen={setSidebarOpen}
      className="bg-gray-50 min-h-screen"
    >
      {/* Stats Cards - Mobile View */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 lg:hidden">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 animate-pulse"
              >
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-300 rounded w-1/2"></div>
              </div>
            ))
          : stats.map((stat, index) => (
              <div
                key={index}
                className="bg-white p-4 rounded-xl shadow-sm border border-gray-200"
              >
                <h4 className="text-sm font-medium text-gray-500">
                  {stat.label}
                </h4>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {typeof stat.value === "number"
                    ? stat.value.toLocaleString()
                    : stat.value}
                </p>
                {stat.change ? (
                  <p
                    className={`text-xs font-medium mt-1 ${
                      stat.change > 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {stat.change > 0 ? "+" : ""}
                    {stat.change.toFixed(2)}%
                  </p>
                ) : null}
              </div>
            ))}
      </div>

      {/* Low Stock Products - Mobile View */}
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

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 pb-10 lg:pb-6">
        {/* Main Chart Area */}
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
              <VisitorsChart data={chartData} />
              <SalesPieChart data={pieData} />
            </>
          )}
        </div>

        {/* Sidebar with Stats and Low Stock */}
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
            <div className="hidden lg:block">
              <DashboardStatsCard stats={highlight} />
            </div>
          )}
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
              {lowStockProducts.length > 0 ? (
                <ul className="divide-y divide-gray-200">
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
              ) : (
                <p className="text-sm text-gray-500">
                  No products with low stock.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="max-w-10lx mx-auto w-full">
        <DashboardBusinessReport />
      </div>
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        userData={user}
      />
    </PageLayout>
  );
}

function LowStockList({ lowStockProducts }) {
  if (lowStockProducts.length === 0) {
    return <p className="text-sm text-gray-500">No products with low stock.</p>;
  }

  return (
    <ul className="divide-y divide-gray-200">
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
