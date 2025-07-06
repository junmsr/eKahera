import React from 'react';
import Card from './Card';

/**
 * StatsCard Component
 * Displays statistics with icons, values, and change indicators
 */
export default function StatsCard({ 
  label, 
  value, 
  change, 
  icon, 
  sub, 
  color = "text-blue-800",
  loading = false,
  className = "",
  formatValue = null
}) {
  // Format display value
  const formatDisplayValue = () => {
    if (formatValue) return formatValue(value);
    
    if (label === 'Growth Rate') return `${value}%`;
    if (label === 'Total Revenue') return `$${value.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
    return value.toLocaleString();
  };

  // Change indicator styles
  const changeColor = change < 0 ? 'text-red-500' : 'text-blue-800';
  const changePrefix = change > 0 ? '+' : '';

  return (
    <Card 
      variant="gradient"
      className={`flex flex-col gap-2 ${loading ? 'opacity-60' : ''} ${className}`}
    >
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className="bg-gradient-to-br from-blue-200 to-blue-400 rounded-full p-2 text-blue-800 shadow">
          {icon}
        </div>
        
        {/* Content */}
        <div>
          <div className="text-xs font-bold text-blue-800 uppercase tracking-wide">
            {label}
          </div>
          <div className="text-2xl font-extrabold text-blue-900 drop-shadow">
            {formatDisplayValue()}
          </div>
        </div>
      </div>
      
      {/* Change indicator */}
      <div className="flex items-center gap-2 mt-2">
        <span className={`text-xs font-bold ${changeColor}`}>
          {changePrefix}{change}%
        </span>
        <span className="text-xs text-blue-500">{sub}</span>
      </div>
    </Card>
  );
} 