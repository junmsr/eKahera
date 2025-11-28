import React from "react";
import Card from "../../common/Card";
import FormField from "../../common/FormField";
import Input from "../../common/Input";
import Button from "../../common/Button";

/**
 * SKU Form Card Component
 * Form for entering SKU codes and quantities
 */
function SkuFormCard({
  sku,
  setSku,
  quantity,
  setQuantity,
  handleAddToCart,
  className = "",
  ...props
}) {
  return (
    <Card
      className={`flex-shrink-0 bg-white/80 backdrop-blur-md border border-white/60 shadow-xl ${className}`}
      variant="glass"
      microinteraction
      {...props}
    >
      <div className="flex flex-col gap-2 sm:gap-3 p-3 sm:p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <svg
              className="w-5 h-5 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
              />
            </svg>
          </div>
          <span className="font-bold text-lg text-gray-900">
            Enter SKU Code
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              SKU Code
            </label>
            <div className="relative">
              <input
                type="text"
                name="sku"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleAddToCart();
                  }
                }}
                placeholder="Scan or enter SKU code"
                className="w-full pl-4 pr-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400 font-medium"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">
              Quantity:
            </label>
            <div className="flex items-center gap-2 flex-1">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition-colors duration-200 flex items-center justify-center"
              >
                −
              </button>
              <input
                type="number"
                name="quantity"
                value={quantity}
                min={1}
                onChange={(e) =>
                  setQuantity(Math.max(1, Number(e.target.value) || 1))
                }
                className="w-20 px-3 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl text-center text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition-colors duration-200 flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>

          <Button
            label="Add to Cart"
            onClick={handleAddToCart}
            className="w-full"
            variant="primary"
            size="lg"
            microinteraction
            icon={
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            }
            iconPosition="left"
          />
        </div>
      </div>
    </Card>
  );
}

export default SkuFormCard;
