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
        className="bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium transition-colors"
      >
        {loading ? "Refreshing..." : "Refresh"}
      </button>

      <select
        className="bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium transition-colors outline-none cursor-pointer"
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
        className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
      >
        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
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
      className="bg-gray-50"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
        {stats.map((stat) => (
          <StatsCard
            key={stat.label}
            {...stat}
            loading={loading}
            className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
          />
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        <VisitorsChart data={chartData} />
        <SalesPieChart data={pieData} />
        <EngagementChart data={chartData} />
        <Card className="bg-white border border-gray-200 p-4">
          <SectionHeader size="md" align="left" className="text-gray-900">
            Acquisition Overview
          </SectionHeader>
          <div className="flex flex-col gap-2">
            <span className="text-lg font-bold text-red-600">-20%</span>
            <span className="text-sm text-gray-600">Down 20% this period</span>
          </div>
        </Card>
        <CustomersChart data={chartData} />
      </div>

      {/* Admin Modal */}
      {/* Admin Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-96 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Update Admin Credentials
            </h2>

            <label className="block mb-2 text-sm font-medium">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 mb-4"
            />

            <label className="block mb-2 text-sm font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 mb-8"
            />

            {/* Buttons */}
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setShowAdminModal(false)}
                className="px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 bg-gray-100 text-gray-800 hover:bg-gray-200 hover:shadow-md"
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
                className="px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md"
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
