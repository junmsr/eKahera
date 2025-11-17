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
import { BiBell, BiUser, BiRefresh } from "react-icons/bi";
import ProfileModal from "../components/modals/ProfileModal";

// Constants
const BLUE_COLORS = ["#2563eb", "#60a5fa", "#93c5fd", "#dbeafe"];

// Chart Components
function VisitorsChart({ data, className = "" }) {
  return (
    <ChartCard
      title="Visitors for the last 6 months"
      className={`bg-white border border-gray-200 ${className}`}
    >
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" tick={{ fill: "#374151" }} />
            <YAxis tick={{ fill: "#374151" }} />
            <Tooltip
              contentStyle={{ background: "#fff", borderColor: "#e5e7eb" }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ r: 4, fill: "#2563eb" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

function SalesPieChart({ data, className = "" }) {
  return (
    <ChartCard title="Sales by Product Category" className={className}>
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
            >
              {data.map((entry, idx) => (
                <Cell
                  key={`cell-${idx}`}
                  fill={BLUE_COLORS[idx % BLUE_COLORS.length]}
                />
              ))}
            </Pie>
            <Legend />
            <Tooltip
              formatter={(value, name, props) => [
                `${Number(value).toFixed(1)}%`,
                props?.payload?.name,
              ]}
              contentStyle={{ background: "#f3e8ff", borderColor: "#2563eb" }}
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
      const [summary, timeseries, customersTs, pie, lowStock] = await Promise.all([
        api("/api/stats/summary", { headers: authHeaders(token) }),
        api(
          `/api/stats/sales-timeseries?days=${range === "week" ? 7 : range === "month" ? 30 : 365}`,
          { headers: authHeaders(token) }
        ),
        api(
          `/api/stats/customers-timeseries?days=${range === "week" ? 7 : range === "month" ? 30 : 365}`,
          { headers: authHeaders(token) }
        ),
        api("/api/stats/sales-by-category", { headers: authHeaders(token) }),
        api("/api/products/low-stock", { headers: authHeaders(token) }),
      ]);

      const derived = timeseries.map((d) => ({
        ...d,
        value: Number(d.value || 0),
      }));
      const pieTotal = pie.reduce((s, p) => s + Number(p.value || 0), 0) || 1;
      const piePercent = pie.map((p) => ({
        ...p,
        percent: (Number(p.value || 0) / pieTotal) * 100,
      }));

      setStats([
        { label: "Total Revenue", value: summary.totalRevenue, change: summary.growthRate },
        { label: "New Customers", value: summary.newCustomers, change: 0 },
        { label: "Active Accounts", value: summary.activeAccounts, change: 0 },
        { label: "Growth Rate", value: summary.growthRate, change: summary.growthRate },
      ]);
      setChartData(derived);
      setPieData(piePercent);
      const totalTx = timeseries.reduce((s, d) => s + Number(d.value || 0), 0);
      const top = (pie || []).slice().sort((a, b) => Number(b.value || 0) - Number(a.value || 0))[0]?.name || "-";
      setHighlight({
        sales: Number(summary.totalRevenue || 0),
        transactions: totalTx,
        topProduct: top,
      });
      setLowStockProducts(lowStock || []);
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
      const readIds = new Set(JSON.parse(sessionStorage.getItem("read_notif_ids") || "[]"));
      const mapped = (resp || []).map((log) => ({
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
    const readIds = JSON.parse(sessionStorage.getItem("read_notif_ids") || "[]");
    if (!readIds.includes(id)) {
      sessionStorage.setItem("read_notif_ids", JSON.stringify([...readIds, id]));
    }
    setNotifications((notifs) => notifs.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  useEffect(() => {
    fetchData();
    fetchNotifications();
  }, [range]);

  const headerActions = (
    <div className="flex flex-nowrap items-center justify-end -gap-3 sm:gap-2">
      <button
        onClick={fetchData}
        disabled={loading}
        title="Refresh Data"
        className="bg-white/80 backdrop-blur-sm hover:bg-white text-gray-700 p-2 rounded-lg border border-gray-200/80 text-sm font-medium transition-all duration-200 hover:shadow-md hover:scale-[1.02]"
      >
        <BiRefresh className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
      </button>

      <select
        className="bg-white/80 backdrop-blur-sm hover:bg-white text-gray-700 px-2 sm:px-3 py-2 rounded-lg border border-gray-200/80 text-sm font-medium transition-all duration-200 outline-none cursor-pointer hover:shadow-md"
        value={range}
        onChange={(e) => setRange(e.target.value)}
        disabled={loading}
      >
        <option value="week">Week</option>
        <option value="month">Month</option>
        <option value="year">Year</option>
      </select>

      <div className="relative" ref={notificationRef}>
        <button
          className="p-2 rounded-full hover:bg-gray-200/80 transition-colors relative"
          onClick={() => setShowNotifications(!showNotifications)}
          title="Notifications"
        >
          <BiBell className="w-5 h-5 text-gray-700" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
        {showNotifications && (
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                      !notification.isRead ? "bg-blue-50" : ""
                    }`}
                    onClick={() => handleMarkAsRead(notification.id)}
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-gray-900">
                        {notification.title}
                      </h4>
                      <span className="text-xs text-gray-500">
                        {notification.time}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {notification.message}
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500">
                  No notifications
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => setShowProfileModal(true)}
        className="flex items-center gap-2 bg-white/80 backdrop-blur-sm p-1 sm:p-1.5 sm:px-3 sm:py-2 rounded-lg border border-gray-200/80 hover:bg-white transition-all duration-200 hover:shadow-md hover:scale-[1.02]"
      >
        <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full flex items-center justify-center text-sm font-medium shadow-md">
          {user.username?.[0]?.toUpperCase() || 'A'}
        </div>
        <span className="text-sm font-medium text-gray-700 hidden sm:inline">{user.username || 'Admin'}</span>
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
              <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-300 rounded w-1/2"></div>
              </div>
            ))
          : stats.map((stat, index) => (
              <div key={index} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <h4 className="text-sm font-medium text-gray-500">{stat.label}</h4>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {typeof stat.value === "number" ? stat.value.toLocaleString() : stat.value}
                </p>
                {stat.change ? (
                  <p className={`text-xs font-medium mt-1 ${stat.change > 0 ? "text-green-600" : "text-red-600"}`}>
                    {stat.change > 0 ? "+" : ""}{stat.change.toFixed(2)}%
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
              <h3 className="text-lg font-bold text-gray-800">Low Stock Products</h3>
              <button
                onClick={async () => {
                  try {
                    const token = sessionStorage.getItem("auth_token");
                    await api("/api/products/send-low-stock-alert", {
                      method: "POST",
                      headers: authHeaders(token),
                    });
                    alert("Low stock alert sent successfully!");
                  } catch (err) {
                    alert("Failed to send low stock alert.");
                  }
                }}
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                Send Alert
              </button>
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
              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 h-[336px] animate-pulse flex items-center justify-center"><div className="w-full h-64 bg-gray-200 rounded-lg"></div></div>
              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 h-[336px] animate-pulse flex items-center justify-center"><div className="w-64 h-64 bg-gray-200 rounded-full"></div></div>
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
          <div className="bg-white p-6 rounded-xl shadow-md hidden lg:block">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">Low Stock Products</h3>
                <button
                  onClick={async () => {
                    try {
                      const token = sessionStorage.getItem("auth_token");
                    await api.post("/api/products/send-low-stock-alert", null, { headers: authHeaders(token) });
                      alert("Low stock alert sent successfully!");
                    } catch (err) {
                      alert("Failed to send low stock alert.");
                    }
                  }}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                  Send Alert
                </button>
              </div>
            <LowStockList lowStockProducts={lowStockProducts} />
            </div>
          )}
        </div>
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
        <li key={product.product_id} className="py-3 flex justify-between items-center">
          <span className="text-sm font-medium text-gray-800">{product.product_name}</span>
          <span className="text-sm font-bold text-red-600">{product.quantity_in_stock} left</span>
        </li>
      ))}
    </ul>
  );
}
