import React, { useState } from "react";
import BaseModal from "./BaseModal";
import Button from "../common/Button";
import FormField from "../common/FormField";
import Loader from "../common/Loader";
import ScannerCard from "../ui/POS/ScannerCard";
import { MdAdd, MdInventory2 } from "react-icons/md";

export default function ProductFormModal({
  isOpen,
  onClose,
  editingProduct,
  productForm,
  onChange,
  categories,
  onSubmit,
  loading,
}) {
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerPaused, setScannerPaused] = useState(false);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
  };

  // Compute effective categories (use passed `categories` if valid,
  // otherwise derive from stored `business_type`).
  const getFallbackCategories = () => {
    const map = {
      "Grocery Store": [
        "Fresh Produce",
        "Meat & Poultry",
        "Seafood",
        "Dairy & Eggs",
        "Bread & Bakery",
        "Snacks & Chips",
        "Beverages",
        "Canned & Packaged Goods",
        "Frozen Food",
        "Rice, Pasta & Grains",
        "Condiments & Spices",
        "Cleaning Supplies",
        "Household Essentials",
        "Baby Products",
        "Pet Supplies",
      ],
      Pharmacy: [
        "Prescription Medicines",
        "OTC Medicines",
        "Vitamins & Supplements",
        "First Aid Supplies",
        "Medical Devices",
        "Personal Care",
        "Hygiene Products",
        "Beauty & Cosmetics",
        "Baby Care",
        "Adult Care",
        "PPE & Sanitizers",
      ],
      "Clothing Store": [
        "Men’s Clothing",
        "Women’s Clothing",
        "Kids’ Clothing",
        "Baby Clothing",
        "Footwear",
        "Bags & Accessories",
        "Underwear & Socks",
      ],
      "Electronics Store": [
        "Mobile Devices",
        "Computers & Laptops",
        "Computer Accessories",
        "Phone Accessories",
        "Audio Devices",
        "Cameras & Photography",
        "Home Appliances",
        "Personal Appliances",
        "Gaming Consoles & Accessories",
        "Cables, Adapters & Chargers",
      ],
      "Hardware Store": [
        "Hand Tools",
        "Power Tools",
        "Construction Materials",
        "Electrical Supplies",
        "Plumbing Supplies",
        "Paint & Painting Supplies",
        "Gardening Tools",
        "Fasteners (Nails, Screws, Bolts)",
        "Safety Gear",
      ],
      Bookstore: [
        "Fiction Books",
        "Non-Fiction Books",
        "Educational Books",
        "Children’s Books",
        "Comics & Manga",
        "School Supplies",
        "Art Materials",
        "Office Supplies",
        "Stationery & Gifts",
      ],
      "Convenience Store": [
        "Snacks",
        "Beverages",
        "Ready-to-Eat Food",
        "Instant Noodles / Cup Meals",
        "Frozen Food",
        "Basic Grocery Items",
        "Toiletries",
        "Basic OTC Medicines",
        "Household Essentials",
        "Phone Load",
        "Ice Cream & Desserts",
        "Tobacco & Lighters",
      ],
      Others: ["General"],
    };

    const stored =
      (typeof window !== "undefined" &&
        sessionStorage.getItem("business_type")) ||
      "Others";
    const list = map[stored] || map["Others"];
    return list.map((name, i) => ({ id: `fb-${i}`, name }));
  };

  const normalizeCategories = (cats) =>
    cats.map((c, i) => ({ id: c.id || `p-${i}`, name: c.name || c }));

  const effectiveCategories = (() => {
    if (categories && categories.length > 0) {
      const first = categories[0];
      const firstName = first && (first.name || first);
      if (
        categories.length === 1 &&
        (firstName === "General" || firstName === "Others")
      ) {
        return getFallbackCategories();
      }
      return normalizeCategories(categories);
    }
    return getFallbackCategories();
  })();

  // Calculate profit margin
  const costPrice = Number(productForm.cost_price) || 0;
  const sellingPrice = Number(productForm.selling_price) || 0;
  const profitMargin =
    costPrice > 0 ? ((sellingPrice - costPrice) / costPrice) * 100 : 0;

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
        label={editingProduct ? "Update Product" : "Add Product"}
        variant="primary"
        type="submit"
        disabled={loading}
        className="flex-1"
        icon={!editingProduct ? <MdAdd className="w-5 h-5" /> : undefined}
        iconPosition="left"
      />
    </div>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={editingProduct ? "Edit Product" : "Add New Product"}
      subtitle={
        editingProduct
          ? "Update product details"
          : "Add a new product to inventory"
      }
      icon={<MdInventory2 className="w-6 h-6 text-white" />}
      size="lg"
      footer={footerContent}
      contentClassName="space-y-6"
    >
      <form onSubmit={handleFormSubmit} className="space-y-6">
        {/* SKU Section */}
        <div className="bg-gradient-to-br from-blue-50/40 to-indigo-50/40 rounded-2xl p-5 border border-blue-100/50 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900">
              SKU & Identification
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="SKU Code"
              name="sku"
              value={productForm.sku}
              onChange={onChange}
              placeholder="Scan or enter SKU"
              required
            />
            <div className="flex items-end">
              <Button
                label={scannerOpen ? "Close Scanner" : "Scan Barcode"}
                type="button"
                variant="secondary"
                onClick={() => setScannerOpen(!scannerOpen)}
                className="w-full"
              />
            </div>
          </div>
          {scannerOpen && (
            <div className="rounded-2xl border border-blue-200 p-4 bg-white">
              <ScannerCard
                onScan={(result) => {
                  const code = result?.[0]?.rawValue || "";
                  if (code) {
                    onChange({ target: { name: "sku", value: code } });
                    setScannerPaused(true);
                  }
                }}
                paused={scannerPaused}
                onResume={() => setScannerPaused(false)}
                textMain="text-blue-700"
              />
            </div>
          )}
        </div>

        {/* Basic Information */}
        <div className="bg-gradient-to-br from-emerald-50/40 to-green-50/40 rounded-2xl p-5 border border-emerald-100/50 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900">Product Information</h3>
          </div>
          <FormField
            label="Product Name"
            name="name"
            value={productForm.name}
            onChange={onChange}
            placeholder="Enter product name"
            required
          />
          <FormField
            label="Description"
            name="description"
            value={productForm.description}
            onChange={onChange}
            placeholder="Product description or notes"
            required
          />
          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-700">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              value={productForm.category}
              onChange={onChange}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-gray-900 font-medium"
              required
            >
              <option value="">Select a category</option>
              {effectiveCategories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            {productForm.category === "Others" && (
              <div className="mt-3">
                <FormField
                  label="Custom Category"
                  name="customCategory"
                  value={productForm.customCategory || ""}
                  onChange={onChange}
                  placeholder="Enter custom category name"
                  required
                />
              </div>
            )}
          </div>
        </div>

        {/* Pricing & Inventory */}
        <div className="bg-gradient-to-br from-purple-50/40 to-pink-50/40 rounded-2xl p-5 border border-purple-100/50 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900">Pricing & Quantity</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              label="Initial Quantity"
              name="quantity"
              type="number"
              value={productForm.quantity}
              onChange={onChange}
              placeholder="0"
              required
            />
            <FormField
              label="Cost Price"
              name="cost_price"
              type="number"
              value={productForm.cost_price}
              onChange={onChange}
              placeholder="0.00"
              required
              step="0.01"
            />
            <FormField
              label="Selling Price"
              name="selling_price"
              type="number"
              value={productForm.selling_price}
              onChange={onChange}
              placeholder="0.00"
              required
              step="0.01"
            />
          </div>

          {/* Profit Margin Indicator */}
          {costPrice > 0 && sellingPrice > 0 && (
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">
                  Profit Margin
                </span>
                <span
                  className={`text-lg font-bold ${
                    profitMargin >= 20
                      ? "text-green-600"
                      : profitMargin >= 10
                      ? "text-yellow-600"
                      : "text-orange-600"
                  }`}
                >
                  {profitMargin.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    profitMargin >= 20
                      ? "bg-green-500"
                      : profitMargin >= 10
                      ? "bg-yellow-500"
                      : "bg-orange-500"
                  }`}
                  style={{
                    width: `${Math.min(profitMargin, 100)}%`,
                  }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {loading && (
          <div className="flex justify-center py-4">
            <Loader size="sm" />
          </div>
        )}
      </form>
    </BaseModal>
  );
}
