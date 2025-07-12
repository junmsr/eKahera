import React from 'react';
import Card from '../../common/Card';

/**
 * Transaction Card Component
 * Displays transaction number in a prominent format
 */
function TransactionCard({ 
  transactionNumber,
  className = '',
  ...props
}) {
  return (
    <Card 
      className={`flex-shrink-0 emphasized-card ${className}`} 
      variant="glass" 
      microinteraction 
      {...props}
    >
      <div className="flex flex-col items-center shadow">
        <div className="text-xs font-semibold text-blue-500">TRANSACTION NUMBER</div>
        <div className="text-3xl font-mono font-bold tracking-widest text-blue-900">{transactionNumber}</div>
      </div>
    </Card>
  );
}

export default TransactionCard; 