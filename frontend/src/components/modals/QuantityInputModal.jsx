import React, { useState, useEffect, useRef } from "react";
import BaseModal from "./BaseModal";
import Button from "../common/Button";
import { MdScale, MdWaterDrop } from "react-icons/md";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";

/**
 * Quantity Input Modal for Weight/Volume Products
 * Shows when adding weight/volume products to cart in POS
 */
function QuantityInputModal({
  isOpen,
  onClose,
  product,
  onConfirm,
  existingQuantity = 0,
}) {
  const [quantity, setQuantity] = useState("");
  const [error, setError] = useState("");
  const quantityInputRef = useRef(null);

  // Reset quantity when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setQuantity("");
      setError("");
      // Focus input after a short delay
      setTimeout(() => {
        quantityInputRef.current?.focus();
        quantityInputRef.current?.select();
      }, 100);
    }
  }, [isOpen]);

  // Get base unit for input (e.g., "L", "mL", "g", "kg")
  const getBaseUnit = () => {
    if (!product) return "";
    const baseUnit = product.base_unit || "";
    return baseUnit;
  };

  // Get base unit display name (e.g., "Liters", "Milliliters")
  const getBaseUnitDisplay = () => {
    if (!product) return "";
    const baseUnit = product.base_unit || "";
    if (baseUnit === 'g') return 'Grams (g)';
    if (baseUnit === 'kg') return 'Kilograms (kg)';
    if (baseUnit === 'mL') return 'Milliliters (mL)';
    if (baseUnit === 'L') return 'Liters (L)';
    return baseUnit;
  };

  // Calculate price per base unit (e.g., price per liter, price per gram)
  const calculatePricePerBaseUnit = () => {
    if (!product || product.product_type === 'count') {
      return Number(product.selling_price || 0);
    }
    const quantityPerUnit = Number(product.quantity_per_unit || 1);
    const pricePerPackage = Number(product.selling_price || 0);
    if (quantityPerUnit > 0) {
      return pricePerPackage / quantityPerUnit;
    }
    return pricePerPackage;
  };

  // Calculate total price for given quantity in base units
  const calculatePrice = (qtyInBaseUnits) => {
    if (!product || product.product_type === 'count') {
      return qtyInBaseUnits * Number(product.selling_price || 0);
    }
    return qtyInBaseUnits * calculatePricePerBaseUnit();
  };

  // Format stock display in base units
  const formatStockDisplay = () => {
    if (!product) return "0";
    const stockInBaseUnits = Number(product.stock_quantity || 0);
    
    if (product.product_type === 'count') {
      return `${stockInBaseUnits} pcs`;
    }
    
    // For weight/volume, show in base units with appropriate conversion for readability
    const baseUnit = getBaseUnit();
    let displayValue = stockInBaseUnits;
    let displayUnit = baseUnit;
    
    // Convert to larger units for better readability
    if (baseUnit === 'g' && stockInBaseUnits >= 1000) {
      displayValue = stockInBaseUnits / 1000;
      displayUnit = 'kg';
    } else if (baseUnit === 'mL' && stockInBaseUnits >= 1000) {
      displayValue = stockInBaseUnits / 1000;
      displayUnit = 'L';
    }
    
    // Format with appropriate decimals
    if (displayValue % 1 === 0) {
      return `${displayValue} ${displayUnit}`;
    }
    return `${displayValue.toFixed(2)} ${displayUnit}`;
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    
    const qty = Number(quantity);
    
    // Validation
    if (!quantity || quantity.trim() === "") {
      setError("Please enter a quantity");
      return;
    }
    
    if (isNaN(qty) || qty <= 0) {
      setError("Quantity must be greater than 0");
      return;
    }
    
    // For weight/volume products, user enters quantity directly in base units (e.g., 0.25L, 1.5L, 250mL)
    // No conversion needed - quantity entered IS the base units
    // For count products, quantity is in pieces (no conversion needed)
    const quantityInBaseUnits = qty;
    
    // Check stock availability
    const availableStock = Number(product.stock_quantity || 0);
    const currentCartQty = existingQuantity || 0; // Already in base units
    
    const totalNeeded = quantityInBaseUnits + currentCartQty;
    
    if (totalNeeded > availableStock) {
      const baseUnit = getBaseUnit();
      setError(`Insufficient stock. Available: ${formatStockDisplay()}, requested: ${qty} ${baseUnit}`);
      return;
    }
    
    // Confirm with quantity in base units
    onConfirm(quantityInBaseUnits);
  };

  // Keyboard shortcuts
  useKeyboardShortcuts(
    [
      {
        key: "escape",
        action: onClose,
        enabled: isOpen,
      },
      {
        key: "enter",
        action: handleSubmit,
        enabled: isOpen && quantity,
      },
    ],
    [isOpen, quantity]
  );

  if (!product) return null;

  const isWeight = product.product_type === 'weight';
  const isVolume = product.product_type === 'volume';
  const availableStock = formatStockDisplay();

  const footerContent = (
    <div className="flex gap-3 w-full">
      <Button
        label="Cancel"
        variant="secondary"
        onClick={onClose}
        type="button"
        className="flex-1"
      />
      <Button
        label="Add to Cart"
        variant="primary"
        type="submit"
        onClick={handleSubmit}
        className="flex-1"
      />
    </div>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Enter Quantity"
      subtitle={`How much ${product.product_name} would you like to add?`}
      icon={isWeight ? <MdScale className="w-6 h-6 text-white" /> : <MdWaterDrop className="w-6 h-6 text-white" />}
      size="md"
      footer={footerContent}
      headerIconBgClassName={
        isWeight
          ? "bg-gradient-to-br from-amber-500 to-orange-600"
          : "bg-gradient-to-br from-blue-500 to-cyan-600"
      }
      contentClassName="space-y-6"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Product Info */}
        <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-xl p-4 border border-slate-200">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">
                {product.product_name}
              </h3>
              <p className="text-sm text-gray-600">
                {isWeight && "Sold by weight"}
                {isVolume && "Sold by volume"}
              </p>
              {product.display_unit && (
                <p className="text-xs text-gray-500 mt-1">
                  Package: {product.display_unit}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-blue-600">
                ₱{Number(product.selling_price || 0).toFixed(2)}
              </p>
              <p className="text-xs text-gray-500">
                Available: {availableStock}
              </p>
            </div>
          </div>
        </div>

        {/* Quantity Input */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            Enter Quantity ({getBaseUnitDisplay()})
            <span className="text-red-500 ml-1">*</span>
          </label>
          <div className="relative">
            <input
              ref={quantityInputRef}
              type="number"
              value={quantity}
              onChange={(e) => {
                setQuantity(e.target.value);
                setError("");
              }}
              placeholder={`e.g., 0.25, 1.5, 250`}
              className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 font-medium text-lg"
              step="0.01"
              min="0.01"
              required
              autoFocus
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
              {getBaseUnit()}
            </div>
          </div>
          {error && (
            <p className="text-sm text-red-600 mt-1">{error}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Enter the quantity in {getBaseUnitDisplay().toLowerCase()}. You can enter any amount (e.g., 0.25L for 250mL, 1.5L, etc.).
            {product.display_unit && product.quantity_per_unit && (
              <span className="block mt-1 text-gray-400">
                (Each package contains {product.quantity_per_unit} {getBaseUnit()})
              </span>
            )}
          </p>
        </div>

        {/* Price Preview */}
        {quantity && !isNaN(Number(quantity)) && Number(quantity) > 0 && (
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">
                Estimated Total:
              </span>
              <span className="text-xl font-bold text-blue-600">
                ₱{calculatePrice(Number(quantity)).toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {quantity} {getBaseUnit()} × ₱{calculatePricePerBaseUnit().toFixed(2)} per {getBaseUnit()}
            </p>
            {product.product_type !== 'count' && product.quantity_per_unit && (
              <p className="text-xs text-gray-400 mt-1">
                (Price per package: ₱{Number(product.selling_price || 0).toFixed(2)} for {product.quantity_per_unit} {getBaseUnit()})
              </p>
            )}
          </div>
        )}
      </form>
    </BaseModal>
  );
}

export default QuantityInputModal;

