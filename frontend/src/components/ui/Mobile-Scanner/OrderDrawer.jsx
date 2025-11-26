import React from "react";
import OrderItemRow from "./OrderItemRow";

function OrderDrawer({ cart, onIncrement, onDecrement, onRemove }) {
  return (
    <div className="w-full">
      <div className="text-blue-900 text-lg font-bold mb-3">Your Order</div>
      <div className="grid grid-cols-[40px_1fr_80px_80px] text-xs text-blue-700 font-semibold px-1 mb-2">
        <div>QTY</div>
        <div>Item</div>
        <div>Price</div>
        <div className="text-right">Settings</div>
      </div>
      <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
        {cart.length === 0 ? (
          <div className="text-blue-500 text-center py-6">
            Scan items to add them to your order.
          </div>
        ) : (
          cart.map((item) => (
            <OrderItemRow
              key={item.sku}
              item={item}
              onIncrement={() => onIncrement(item.sku)}
              onDecrement={() => onDecrement(item.sku)}
              onRemove={() => onRemove(item.sku)}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default OrderDrawer;
