import React from 'react';

function OrderItemRow({ item, onIncrement, onDecrement, onRemove }) {
  return (
    <div className="grid grid-cols-[40px_1fr_80px_80px] items-center gap-2 py-2">
      <div className="text-sm text-blue-900 font-semibold">{item.quantity}x</div>
      <div>
        <input
          value={item.name}
          readOnly
          className="w-full px-3 py-2 rounded-lg border border-blue-200 bg-white text-blue-900 text-sm shadow-sm focus:outline-none"
        />
      </div>
      <div className="text-right text-sm text-blue-900 font-semibold">₱{item.price.toFixed(2)}</div>
      <div className="flex items-center justify-end gap-3">
        <button onClick={onDecrement} className="text-blue-700">−</button>
        <button onClick={onIncrement} className="text-blue-700">＋</button>
        <button onClick={onRemove} className="text-red-600">🗑</button>
      </div>
    </div>
  );
}

export default OrderItemRow;