import React from 'react';
import Card from './Card';

function TransactionCard({ transactionNumber, cardBg }) {
  return (
    <Card className={`flex flex-col items-center shadow flex-shrink-0 ${cardBg} emphasized-card`} microinteraction>
      <div className="text-xs font-semibold text-blue-500">TRANSACTION NUMBER</div>
      <div className="text-3xl font-mono font-bold tracking-widest text-blue-900">{transactionNumber}</div>
    </Card>
  );
}

export default TransactionCard; 