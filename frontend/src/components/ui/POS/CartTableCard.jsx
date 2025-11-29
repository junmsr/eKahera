import React, { useState, useEffect } from "react";
import Card from "../../common/Card";
import Button from "../../common/Button";

/**
 * Cart Table Card Component
 * Displays cart items in a table format with totals
 */
function CartTableCard({
  cart,
  handleRemove,
  handleEditQuantity,
  total,
  className = "",
  ...props
}) {
  const [editingIdx, setEditingIdx] = useState(null);
  const [editQty, setEditQty] = useState(1);

  // Keyboard shortcuts: F1 for edit, F2 for remove
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "F1" && cart.length > 0) {
        event.preventDefault();
        const firstItemIdx = 0;
        setEditingIdx(firstItemIdx);
        setEditQty(cart[firstItemIdx].quantity);
      } else if (event.key === "F2" && cart.length > 0) {
        event.preventDefault();
        const firstItemIdx = 0;
        handleRemove(firstItemIdx);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [cart, handleRemove]);

  const EditIcon = () => (
    <svg
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 1 1 2.828 2.828L11.828 15.828a4 4 0 0 1-1.414.828l-4.243 1.414 1.414-4.243a4 4 0 0 1 .828-1.414z" />
    </svg>
  );

  const DeleteIcon = () => (
    <svg
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
    </svg>
  );

  return (
    <Card
      className={`flex-1 flex flex-col bg-white/80 backdrop-blur-md border border-white/60 shadow-xl transition-all duration-300 h-full min-h-0 overflow-hidden ${className}`}
      variant="glass"
      {...props}
    >
      <div className="flex-1 min-h-0 flex flex-col p-2 sm:p-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-4 h-4 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-gray-900">
              Shopping Cart
            </h3>
          </div>
          <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
            {cart.length} {cart.length === 1 ? "item" : "items"}
          </span>
        </div>

        {/* Table Container */}
        <div className="flex-1 overflow-auto min-h-0 rounded-lg">
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-gradient-to-r from-blue-50/90 to-indigo-50/90 backdrop-blur-sm border-b border-blue-100">
              <tr>
                <th className="py-1.5 px-2 text-left text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Product
                </th>
                <th className="py-1.5 px-2 text-center text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Qty
                </th>
                <th className="py-1.5 px-2 text-right text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Price
                </th>
                <th className="py-1.5 px-2 text-right text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Total
                </th>
                <th className="py-1.5 px-2 text-center text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cart.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                        <svg
                          className="w-6 h-6 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                      </div>
                      <p className="text-gray-500 text-sm font-semibold">
                        Cart is empty
                      </p>
                      <p className="text-gray-400 text-xs mt-1">
                        Scan or enter products
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                cart.map((item, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-blue-50/50 transition-colors duration-200 group"
                  >
                    <td className="py-1.5 px-2">
                      <div className="flex flex-col">
                        <span className="text-xs sm:text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-gray-500 truncate">
                          SKU: {item.sku || "N/A"}
                        </span>
                      </div>
                    </td>
                    <td className="py-1.5 px-2 text-center">
                      {editingIdx === idx ? (
                        <input
                          type="number"
                          min="1"
                          value={editQty}
                          onChange={(e) =>
                            setEditQty(
                              Math.max(1, parseInt(e.target.value) || 1)
                            )
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleEditQuantity(idx, editQty);
                              setEditingIdx(null);
                            } else if (e.key === "Escape") {
                              setEditingIdx(null);
                            }
                          }}
                          onBlur={() => {
                            handleEditQuantity(idx, editQty);
                            setEditingIdx(null);
                          }}
                          className="w-12 h-7 text-center text-xs font-bold border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                      ) : (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-blue-100 text-blue-700 font-bold text-xs">
                          {item.quantity}
                        </span>
                      )}
                    </td>
                    <td className="py-1.5 px-2 text-right">
                      <span className="text-xs sm:text-sm font-medium text-gray-700">
                        ₱{item.price.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-1.5 px-2 text-right">
                      <span className="text-xs sm:text-sm font-bold text-blue-600">
                        ₱
                        {(
                          item.price *
                          (editingIdx === idx ? editQty : item.quantity)
                        ).toFixed(2)}
                      </span>
                    </td>
                    <td className="py-1.5 px-2">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            setEditingIdx(idx);
                            setEditQty(item.quantity);
                          }}
                          className="p-1.5 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 transition-all duration-200"
                          title="Edit (F1)"
                        >
                          <EditIcon />
                        </button>
                        <button
                          onClick={() => handleRemove(idx)}
                          className="p-1.5 rounded-md bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-all duration-200"
                          title="Remove (F2)"
                        >
                          <DeleteIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Total Footer */}
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-sm sm:text-base font-semibold text-gray-700">
              Total:
            </span>
            <span className="text-lg sm:text-xl font-extrabold text-blue-600">
              ₱
              {cart
                .reduce(
                  (sum, item, idx) =>
                    sum +
                    item.price * (editingIdx === idx ? editQty : item.quantity),
                  0
                )
                .toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default CartTableCard;
