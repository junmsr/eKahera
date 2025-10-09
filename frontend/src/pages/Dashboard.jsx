import React, { useState, useEffect } from "react";
import { api, authHeaders } from "../lib/api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// Components
import PageLayout from "../components/layout/PageLayout";
import NavAdmin from "../components/layout/Nav-Admin";
import StatsCard from "../components/ui/Dashboard/StatsCard";
import ChartCard from "../components/ui/Dashboard/ChartCard";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import SectionHeader from "../components/layout/SectionHeader";

// Constants
const BLUE_COLORS = ["#2563eb", "#60a5fa", "#93c5fd", "#dbeafe"];

// Initial data
const initialStats = [
  {
    label: "Total Revenue",
    value: 0,
    change: 0,
    icon: (
      <svg
        width="32"
        height="32"
        fill="none"
        stroke="#2563eb"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 0V4m0 16v-4" />
      </svg>
    ),
    sub: "Trending up this month",
  },
  {
    label: "New Customers",
    value: 0,
    change: 0,
    icon: (
      <svg
        width="32"
        height="32"
        fill="none"
        stroke="#2563eb"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="8" r="4" />
        <path d="M5.5 21a7.5 7.5 0 0 1 13 0" />
      </svg>
    ),
    sub: "Down 20% this period",
  },
  {
    label: "Active Accounts",
    value: 0,
    change: 0,
    icon: (
      <svg
        width="32"
        height="32"
        fill="none"
        stroke="#2563eb"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <rect x="4" y="4" width="16" height="16" rx="4" />
        <path d="M9 9h6v6H9z" />
      </svg>
    ),
    sub: "Strong user retention",
  },
  {
    label: "Growth Rate",
    value: 0,
    change: 0,
    icon: (
      <svg
        width="32"
        height="32"
        fill="none"
        stroke="#2563eb"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M3 17l6-6 4 4 8-8" />
        <path d="M14 7h7v7" />
      </svg>
    ),
    sub: "Steady performance increase",
  },
];

const timeRanges = [
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
  { label: "This Year", value: "year" },
];

// Utility functions
function randomizeStats(stats) {
  return stats.map((stat) => ({
    ...stat,
    value: Math.round(stat.value * (0.9 + Math.random() * 0.2)),
    change: Math.round(stat.change * (0.9 + Math.random() * 0.2) * 10) / 10,
  }));
}

// Chart Components
function VisitorsChart({ data }) {
  return (
    <ChartCard
      title="Visitors for the last 6 months"
      className="bg-white border border-gray-200"
    >
      <ResponsiveContainer width="100%" height={180}>
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
    </ChartCard>
  );
}

function SalesPieChart({ data }) {
  return (
    <ChartCard title="Sales by Product Category">
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={60}
            label
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
            contentStyle={{ background: "#f3e8ff", borderColor: "#2563eb" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function EngagementChart({ data }) {
  return (
    <ChartCard title="Engagement exceed targets">
      <ResponsiveContainer width="100%" height={180}>
        <BarChart
          data={data}
          margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e9d5ff" />
          <XAxis dataKey="name" tick={{ fill: "#2563eb", fontWeight: 700 }} />
          <YAxis tick={{ fill: "#2563eb", fontWeight: 700 }} />
          <Tooltip
            contentStyle={{ background: "#f3e8ff", borderColor: "#2563eb" }}
          />
          <Bar dataKey="engagement" fill="#2563eb" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function CustomersChart({ data }) {
  return (
    <ChartCard title="Customers">
      <ResponsiveContainer width="100%" height={180}>
        <BarChart
          data={data}
          margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e9d5ff" />
          <XAxis dataKey="name" tick={{ fill: "#2563eb", fontWeight: 700 }} />
          <YAxis tick={{ fill: "#2563eb", fontWeight: 700 }} />
          <Tooltip
            contentStyle={{ background: "#f3e8ff", borderColor: "#2563eb" }}
          />
          <Bar dataKey="customers" fill="#2563eb" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// Main Dashboard Component
export default function Dashboard() {
  // State
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [stats, setStats] = useState(initialStats);
  const [range, setRange] = useState("week");
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [pieData, setPieData] = useState([]);

  // Admin modal state
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  // Data fetching
  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("auth_token");
      const summary = await api("/api/stats/summary", {
        headers: authHeaders(token),
      });
      const timeseries = await api(
        `/api/stats/sales-timeseries?days=${
          range === "week" ? 7 : range === "month" ? 30 : 365
        }`,
        { headers: authHeaders(token) }
      );
      const pie = await api("/api/stats/sales-by-category", {
        headers: authHeaders(token),
      });
      setStats([
        {
          ...initialStats[0],
          value: summary.totalRevenue,
          change: summary.growthRate,
        },
        { ...initialStats[1], value: summary.newCustomers, change: 0 },
        { ...initialStats[2], value: summary.activeAccounts, change: 0 },
        {
          ...initialStats[3],
          value: summary.growthRate,
          change: summary.growthRate,
        },
      ]);
      setChartData(
        timeseries.map((d) => ({ ...d, customers: 0, engagement: 0 }))
      );
      setPieData(pie);
    } catch (err) {
      setStats(initialStats);
      setChartData([]);
      setPieData([]);
    } finally {
      setLoading(false);
    }
  };

  // Effects
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  // Header actions
  const headerActions = (
    <div className="flex items-center gap-4">
      <button
        onClick={fetchData}
        disabled={loading}
        className="bg-white/80 backdrop-blur-sm hover:bg-white text-gray-700 px-4 py-2.5 rounded-xl border border-white/50 text-sm font-medium transition-all duration-200 hover:shadow-md hover:scale-[1.02]"
      >
        {loading ? "Refreshing..." : "Refresh"}
      </button>

      <select
        className="bg-white/80 backdrop-blur-sm hover:bg-white text-gray-700 px-4 py-2.5 rounded-xl border border-white/50 text-sm font-medium transition-all duration-200 outline-none cursor-pointer hover:shadow-md"
        value={range}
        onChange={(e) => setRange(e.target.value)}
        disabled={loading}
      >
        {timeRanges.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Admin Button */}
      <button
        onClick={() => setShowAdminModal(true)}
        className="flex items-center gap-3 bg-white/80 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-white/50 hover:bg-white transition-all duration-200 hover:shadow-md hover:scale-[1.02]"
      >
        <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full flex items-center justify-center text-sm font-medium shadow-lg">
          A
        </div>
        <span className="text-sm font-medium text-gray-700">Admin</span>
      </button>
    </div>
  );

  return (
    <PageLayout
      title="DASHBOARD"
      subtitle="Overview of your business performance"
      sidebar={<NavAdmin active={activeNav} onNavigate={setActiveNav} />}
      headerActions={headerActions}
      className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-screen relative overflow-hidden"
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-gradient-to-tr from-indigo-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-gradient-to-tl from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6 relative z-10">
        {stats.map((stat) => (
          <StatsCard
            key={stat.label}
            {...stat}
            loading={loading}
            className="bg-white/80 backdrop-blur-md border border-white/60 shadow-xl hover:shadow-2xl hover:scale-[1.03] hover:-translate-y-1 transition-all duration-500 group"
          />
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 relative z-10">
        <VisitorsChart data={chartData} />
        <SalesPieChart data={pieData} />
        <EngagementChart data={chartData} />
        <Card className="bg-gradient-to-br from-red-50/80 to-orange-50/80 backdrop-blur-md border border-red-200/50 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 p-6 group">
          <SectionHeader size="md" align="left" className="text-gray-900 mb-6 font-bold">
            Acquisition Overview
          </SectionHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-orange-100 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
              </div>
              <div>
                <span className="text-3xl font-bold text-red-600">-20%</span>
                <p className="text-sm text-gray-600 font-medium">Down 20% this period</p>
              </div>
            </div>
            <div className="w-full bg-red-100/50 rounded-full h-2">
              <div className="bg-gradient-to-r from-red-500 to-orange-500 h-2 rounded-full w-1/5 transition-all duration-1000"></div>
            </div>
          </div>
        </Card>
        <CustomersChart data={chartData} />
      </div>

      {/* Admin Modal */}
      {/* Admin Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/20 flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-md p-8 border border-white/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Update Admin Credentials
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-3 bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-3 bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 justify-end mt-8">
              <button
                onClick={() => setShowAdminModal(false)}
                className="px-6 py-3 rounded-xl font-medium text-sm transition-all duration-200 bg-gray-100/80 backdrop-blur-sm text-gray-800 hover:bg-gray-200 hover:shadow-md hover:scale-[1.02]"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    setSaving(true);
                    const token = localStorage.getItem("auth_token");
                    await api("/api/admin/update-credentials", {
                      method: "POST",
                      headers: {
                        ...authHeaders(token),
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({ username, password }),
                    });
                    alert("Credentials updated successfully!");
                    setShowAdminModal(false);
                  } catch (err) {
                    alert("Failed to update credentials");
                  } finally {
                    setSaving(false);
                  }
                }}
                className="px-6 py-3 rounded-xl font-medium text-sm transition-all duration-200 bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 hover:shadow-lg hover:scale-[1.02]"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
