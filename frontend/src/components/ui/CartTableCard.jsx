import React from 'react';
import Card from './Card';
import Button from '../common/Button';

/**
 * Cart Table Card Component
 * Displays cart items in a table format with totals
 */
function CartTableCard({ 
  cart,
  handleRemove,
  total,
  className = '',
  ...props
}) {
  return (
    <Card 
      className={`flex-1 flex flex-col shadow-2xl h-full min-h-0 emphasized-card ${className}`} 
      variant="glass" 
      microinteraction 
      {...props}
    >
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="overflow-auto flex-1 min-h-0 rounded-2xl" style={{ maxHeight: 'calc(100vh - 220px)' }}>
          <table className="w-full text-left mb-4">
            <thead className="sticky top-0 z-10 bg-white/70 backdrop-blur-xl">
              <tr className="border-b border-blue-300/40">
                <th className="py-2 text-blue-800 text-lg font-bold">Product</th>
                <th className="text-blue-800 text-lg font-bold">Quantity</th>
                <th className="text-blue-800 text-lg font-bold">Price</th>
                <th className="text-blue-800 text-lg font-bold">Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cart.length === 0 ? (
                <tr><td colSpan={5} className="text-center text-blue-300 py-8">No items</td></tr>
              ) : cart.map((item, idx) => (
                <tr key={idx} className="border-b border-blue-100/40 hover:bg-blue-50/60 transition-colors">
                  <td className="font-medium text-blue-900 text-lg">{item.name}</td>
                  <td className="text-lg">{item.quantity}</td>
                  <td className="text-lg">₱{item.price.toFixed(2)}</td>
                  <td className="text-lg">₱{(item.price * item.quantity).toFixed(2)}</td>
                  <td>
                    <Button label="✎" size="sm" variant="secondary" className="mr-1" onClick={() => {}} microinteraction />
                    <Button label="✖" size="sm" variant="primary" onClick={() => handleRemove(idx)} microinteraction />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end text-2xl font-extrabold text-blue-800 mt-2 tracking-tight">TOTAL: <span className="ml-2 text-blue-900">₱{total.toFixed(2)}</span></div>
      </div>
    </Card>
  );
}

export default CartTableCard; 