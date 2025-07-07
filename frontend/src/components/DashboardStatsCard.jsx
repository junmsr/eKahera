import React from 'react';
import Card from './Card';

function DashboardStatsCard({ stats }) {
  return (
    <Card
      className="glass-dashboard-card flex flex-row items-center justify-between gap-6 p-6 md:p-8 shadow-2xl"
      variant="glass"
      padding="none"
      microinteraction
    >
      <div className="flex flex-col gap-2">
        <span className="text-lg font-bold text-blue-700 tracking-wide">Today's Sales</span>
        <span className="text-3xl md:text-4xl font-extrabold text-blue-900">₱{stats.sales.toLocaleString()}</span>
      </div>
      <div className="flex flex-col gap-2 items-center">
        <span className="text-lg font-bold text-blue-700">Transactions</span>
        <span className="text-2xl font-bold text-blue-900">{stats.transactions}</span>
      </div>
      <div className="flex flex-col gap-2 items-end">
        <span className="text-lg font-bold text-blue-700">Top Product</span>
        <span className="text-xl font-semibold text-blue-900 flex items-center gap-2">
          <span className="material-icons text-blue-400 text-2xl">star</span>
          {stats.topProduct}
        </span>
      </div>
      <style>{`
        .glass-dashboard-card {
          background: linear-gradient(135deg, rgba(255,255,255,0.7) 60%, rgba(59,130,246,0.10) 100%);
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.18), 0 1.5px 8px 0 rgba(59,130,246,0.10);
          border: 2.5px solid rgba(59,130,246,0.13);
          backdrop-filter: blur(18px) saturate(1.2);
          border-radius: 2rem;
          transition: box-shadow 0.25s, border 0.25s;
        }
        .glass-dashboard-card:focus-within, .glass-dashboard-card:hover {
          box-shadow: 0 12px 40px 0 rgba(59,130,246,0.22), 0 2px 12px 0 rgba(59,130,246,0.13);
          border-color: #3b82f6;
        }
      `}</style>
    </Card>
  );
}

export default DashboardStatsCard; 