import React from 'react';
import Card from '../../common/Card';

/**
 * Transaction Card Component
 * Displays transaction number in a prominent format
 */
function TransactionCard({ 
  transactionNumber,
  transactionId,
  className = '',
  ...props
}) {
  return (
    <Card 
      className={`flex-shrink-0 emphasized-card h-45 ${className}`} 
      variant="glass" 
      microinteraction 
      {...props}
    >
      <div className="flex flex-col items-center shadow mt-7">
        <div className="text-xs font-semibold text-blue-500">TRANSACTION NUMBER</div>
        <div className="text-3xl font-mono font-bold tracking-widest text-blue-900">{transactionNumber || '—'}</div>
        <div className="text-[10px] text-blue-500 mt-1">ID: {transactionId ?? '—'}</div>
      </div>
    </Card>
  );
}

export default TransactionCard;