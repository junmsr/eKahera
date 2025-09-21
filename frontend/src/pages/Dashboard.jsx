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
    <ChartCard title="Visitors for the last 6 months">
      <ResponsiveContainer width="100%" height={180}>
        <LineChart
          data={data}
          margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e9d5ff" />
          <XAxis dataKey="name" tick={{ fill: "#2563eb", fontWeight: 700 }} />
          <YAxis tick={{ fill: "#2563eb", fontWeight: 700 }} />
          <Tooltip
            contentStyle={{ background: "#f3e8ff", borderColor: "#2563eb" }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#2563eb"
            strokeWidth={3}
            dot={{ r: 4, fill: "#2563eb" }}
            activeDot={{ r: 6 }}
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
    <>
      <Button
        variant="primary"
        onClick={fetchData}
        disabled={loading}
        className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center shadow-lg hover:scale-105 transition"
      >
        {loading ? "Refreshing..." : "Refresh"}
      </Button>

      <select
        className="bg-blue-200 text-blue-800 px-4 py-2 rounded-lg font-semibold outline-none border-none shadow"
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

      <div className="flex items-center gap-2 bg-gradient-to-r from-blue-100 to-blue-200 px-3 py-2 rounded-lg shadow">
        <span className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center font-bold text-white shadow">
          A
        </span>
        <span className="text-sm font-semibold text-blue-800">Admin</span>
      </div>
    </>
  );

  return (
    <PageLayout
      title="DASHBOARD"
      subtitle="Overview of your business performance"
      sidebar={<NavAdmin active={activeNav} onNavigate={setActiveNav} />}
      headerActions={headerActions}
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-8 py-6">
        {stats.map((stat) => (
          <StatsCard key={stat.label} {...stat} loading={loading} />
        ))}
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-8 pb-8">
        <VisitorsChart data={chartData} />
        <SalesPieChart data={pieData} />
        <EngagementChart data={chartData} />

        {/* Acquisition Card */}
        <Card variant="gradient">
          <SectionHeader size="md" align="left">
            Acquisition needs attention
          </SectionHeader>
          <div className="flex flex-col gap-2">
            <span className="text-lg font-bold text-red-500">-20%</span>
            <span className="text-xs text-blue-500">Down 20% this period</span>
          </div>
        </Card>

        <CustomersChart data={chartData} />
      </div>
    </PageLayout>
  );
}
