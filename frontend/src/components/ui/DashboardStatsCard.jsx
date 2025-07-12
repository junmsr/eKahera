import React from 'react';
import Card from './Card';

/**
 * Dashboard Stats Card Component
 * Displays dashboard statistics with sales, transactions, and top product
 */
function DashboardStatsCard({ 
  stats,
  className = '',
  ...props
}) {
  return (
    <Card 
      className={`${className}`} 
      variant="glass" 
      microinteraction 
      {...props}
    >
      <div className="flex flex-row items-center justify-between gap-6 p-6 md:p-8 shadow-2xl">
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
      </div>
    </Card>
  );
}

export default DashboardStatsCard; 