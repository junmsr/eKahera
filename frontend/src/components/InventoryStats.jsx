import React from 'react';
import StatsCard from './StatsCard';

export default function InventoryStats({ stats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, i) => (
        <StatsCard
          key={stat.label}
          label={stat.label}
          value={stat.value}
          icon={stat.icon}
          color={stat.color}
          change={0}
          sub={i === 1 ? 'This Month' : ''}
          className="h-full"
        />
      ))}
    </div>
  );
} 