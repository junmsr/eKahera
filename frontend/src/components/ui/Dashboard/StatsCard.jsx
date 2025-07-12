import React from 'react';
import Card from '../../common/Card';

/**
 * Stats Card Component
 * Displays statistics with icon, value, and change indicator
 */
function StatsCard({ 
  label,
  value,
  change = 0,
  icon,
  sub = '',
  color = "text-blue-800",
  loading = false,
  formatValue = null,
  className = '',
  ...props
}) {
  const formatDisplayValue = () => {
    if (formatValue) return formatValue(value);
    
    if (label === 'Growth Rate') return `${value}%`;
    if (label === 'Total Revenue') return `$${value.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
    return value.toLocaleString();
  };

  const changeColor = change < 0 ? 'text-red-500' : 'text-blue-800';
  const changePrefix = change > 0 ? '+' : '';

  return (
    <Card 
      className={`h-full ${className}`} 
      variant="gradient" 
      microinteraction 
      {...props}
    >
      <div className={`flex flex-col gap-2 ${loading ? 'opacity-60' : ''}`}>
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-200 to-blue-400 rounded-full p-2 text-blue-800 shadow">
            {icon}
          </div>
          <div>
            <div className="text-xs font-bold text-blue-800 uppercase tracking-wide">
              {label}
            </div>
            <div className="text-2xl font-extrabold text-blue-900 drop-shadow">
              {formatDisplayValue()}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className={`text-xs font-bold ${changeColor}`}>
            {changePrefix}{change}%
          </span>
          <span className="text-xs text-blue-500">{sub}</span>
        </div>
      </div>
    </Card>
  );
}

export default StatsCard; 