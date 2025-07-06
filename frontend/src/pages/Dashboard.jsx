import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';

// Components
import PageLayout from '../components/PageLayout';
import NavAdmin from '../components/Nav-Admin';
import StatsCard from '../components/StatsCard';
import Card from '../components/Card';
import Button from '../components/Button';
import SectionHeader from '../components/SectionHeader';

// Constants
const PURPLE_COLORS = ['#a21caf', '#a78bfa', '#c4b5fd', '#f3e8ff'];

// Initial data
const initialStats = [
  {
    label: 'Total Revenue',
    value: 1250,
    change: 12.5,
    icon: (
      <svg width="32" height="32" fill="none" stroke="#a21caf" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 0V4m0 16v-4"/>
      </svg>
    ),
    sub: 'Trending up this month'
  },
  {
    label: 'New Customers',
    value: 1234,
    change: -20,
    icon: (
      <svg width="32" height="32" fill="none" stroke="#a21caf" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="8" r="4"/>
        <path d="M5.5 21a7.5 7.5 0 0 1 13 0"/>
      </svg>
    ),
    sub: 'Down 20% this period'
  },
  {
    label: 'Active Accounts',
    value: 45678,
    change: 12.5,
    icon: (
      <svg width="32" height="32" fill="none" stroke="#a21caf" strokeWidth="2" viewBox="0 0 24 24">
        <rect x="4" y="4" width="16" height="16" rx="4"/>
        <path d="M9 9h6v6H9z"/>
      </svg>
    ),
    sub: 'Strong user retention'
  },
  {
    label: 'Growth Rate',
    value: 4.5,
    change: 4.5,
    icon: (
      <svg width="32" height="32" fill="none" stroke="#a21caf" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M3 17l6-6 4 4 8-8"/>
        <path d="M14 7h7v7"/>
      </svg>
    ),
    sub: 'Steady performance increase'
  }
];

const timeRanges = [
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'This Year', value: 'year' },
];

// Utility functions
function randomizeStats(stats) {
  return stats.map(stat => ({
    ...stat,
    value: Math.round(stat.value * (0.9 + Math.random() * 0.2)),
    change: Math.round((stat.change * (0.9 + Math.random() * 0.2)) * 10) / 10
  }));
}

function generateChartData(range) {
  const length = range === 'week' ? 7 : range === 'month' ? 30 : 12;
  return Array.from({ length }, (_, i) => ({
    name: range === 'year' ? `M${i+1}` : `D${i+1}`,
    value: Math.round(100 + Math.random() * 200),
    customers: Math.round(20 + Math.random() * 50),
    engagement: Math.round(50 + Math.random() * 100),
  }));
}

function generatePieData() {
  return [
    { name: 'Alcohol', value: Math.round(100 + Math.random() * 100) },
    { name: 'Chips', value: Math.round(80 + Math.random() * 80) },
    { name: 'Biscuit', value: Math.round(60 + Math.random() * 60) },
    { name: 'Softdrinks', value: Math.round(90 + Math.random() * 90) },
  ];
}

// Chart Components
function VisitorsChart({ data }) {
  return (
    <Card variant="gradient">
      <SectionHeader size="md" align="left">Visitors for the last 6 months</SectionHeader>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e9d5ff" />
          <XAxis dataKey="name" tick={{ fill: '#a21caf', fontWeight: 700 }} />
          <YAxis tick={{ fill: '#a21caf', fontWeight: 700 }} />
          <Tooltip contentStyle={{ background: '#f3e8ff', borderColor: '#a21caf' }} />
          <Line type="monotone" dataKey="value" stroke="#a21caf" strokeWidth={3} dot={{ r: 4, fill: '#a21caf' }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}

function SalesPieChart({ data }) {
  return (
    <Card variant="gradient">
      <SectionHeader size="md" align="left">Sales by Product Category</SectionHeader>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label>
            {data.map((entry, idx) => (
              <Cell key={`cell-${idx}`} fill={PURPLE_COLORS[idx % PURPLE_COLORS.length]} />
            ))}
          </Pie>
          <Legend />
          <Tooltip contentStyle={{ background: '#f3e8ff', borderColor: '#a21caf' }} />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}

function EngagementChart({ data }) {
  return (
    <Card variant="gradient">
      <SectionHeader size="md" align="left">Engagement exceed targets</SectionHeader>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e9d5ff" />
          <XAxis dataKey="name" tick={{ fill: '#a21caf', fontWeight: 700 }} />
          <YAxis tick={{ fill: '#a21caf', fontWeight: 700 }} />
          <Tooltip contentStyle={{ background: '#f3e8ff', borderColor: '#a21caf' }} />
          <Bar dataKey="engagement" fill="#a21caf" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

function CustomersChart({ data }) {
  return (
    <Card variant="gradient">
      <SectionHeader size="md" align="left">Customers</SectionHeader>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e9d5ff" />
          <XAxis dataKey="name" tick={{ fill: '#a21caf', fontWeight: 700 }} />
          <YAxis tick={{ fill: '#a21caf', fontWeight: 700 }} />
          <Tooltip contentStyle={{ background: '#f3e8ff', borderColor: '#a21caf' }} />
          <Bar dataKey="customers" fill="#a21caf" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

// Main Dashboard Component
export default function Dashboard() {
  // State
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [stats, setStats] = useState(initialStats);
  const [range, setRange] = useState('week');
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState(generateChartData('week'));
  const [pieData, setPieData] = useState(generatePieData());

  // Data fetching
  const fetchData = () => {
    setLoading(true);
    setTimeout(() => {
      setStats(randomizeStats(initialStats));
      setChartData(generateChartData(range));
      setPieData(generatePieData());
      setLoading(false);
    }, 900);
  };

  // Effects
  useEffect(() => {
    fetchData();
  }, [range]);

  // Header actions
  const headerActions = (
    <>
      <Button
        variant="primary"
        onClick={fetchData}
        disabled={loading}
        className="bg-gradient-to-r from-purple-500 to-purple-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center shadow-lg hover:scale-105 transition"
      >
        {loading ? 'Refreshing...' : 'Refresh'}
      </Button>
      
      <select
        className="bg-purple-200 text-purple-800 px-4 py-2 rounded-lg font-semibold outline-none border-none shadow"
        value={range}
        onChange={e => setRange(e.target.value)}
        disabled={loading}
      >
        {timeRanges.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      
      <div className="flex items-center gap-2 bg-gradient-to-r from-purple-100 to-purple-200 px-3 py-2 rounded-lg shadow">
        <span className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center font-bold text-white shadow">A</span>
        <span className="text-sm font-semibold text-purple-800">Admin</span>
      </div>
    </>
  );

  return (
    <PageLayout
      title="Dashboard"
      sidebar={<NavAdmin active={activeNav} onNavigate={setActiveNav} />}
      headerActions={headerActions}
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-8 py-6">
        {stats.map(stat => (
          <StatsCard
            key={stat.label}
            {...stat}
            loading={loading}
          />
        ))}
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-8 pb-8">
        <VisitorsChart data={chartData} />
        <SalesPieChart data={pieData} />
        <EngagementChart data={chartData} />
        
        {/* Acquisition Card */}
        <Card variant="gradient">
          <SectionHeader size="md" align="left">Acquisition needs attention</SectionHeader>
          <div className="flex flex-col gap-2">
            <span className="text-lg font-bold text-red-500">-20%</span>
            <span className="text-xs text-purple-500">Down 20% this period</span>
          </div>
        </Card>
        
        <CustomersChart data={chartData} />
      </div>
    </PageLayout>
  );
}