import React, { useState, useEffect } from "react";
import Button from "../common/Button";
import FormField from "../common/FormField";
import Loader from "../common/Loader";
import ScannerCard from "../ui/POS/ScannerCard";
import { supabase } from "../../lib/supabase";

/**
 * Stock Form Component
 * Internal component for stock entry form
 */
function StockForm({ stockForm, onChange, onSubmit, loading, onClose }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {!stockForm?.sku && (
        <FormField
          label="SKU Code"
          name="sku"
          value={stockForm?.sku || ""}
          onChange={onChange}
          placeholder="Enter SKU"
        />
      )}
      <FormField
        label="Quantity to Add"
        name="quantity"
        type="number"
        value={stockForm?.quantity || ""}
        onChange={onChange}
        placeholder="Enter quantity"
        required
      />
      <div className="flex justify-end gap-2 mt-4">
        <Button
          label="Cancel"
          variant="secondary"
          onClick={onClose}
          type="button"
        />
        <Button
          label="Add Stock"
          variant="primary"
          type="submit"
          disabled={loading}
        />
      </div>
      {loading && <Loader size="sm" className="mt-2" />}
    </form>
  );
}

/**
 * Product Form Component
 * Internal component for product form fields
 */
function ProductForm({
  editingProduct,
  productForm,
  onChange,
  categories,
  onSubmit,
  loading,
  onClose,
  businessType,
  error,
}) {
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerPaused, setScannerPaused] = useState(false);

  // Compute effective categories: prefer passed `categories`, otherwise
  // derive from stored `business_type` using the hard-coded mapping.
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

    const storedFromSession =
      (typeof window !== "undefined" &&
        sessionStorage.getItem("business_type")) ||
      null;
    let stored = businessType || storedFromSession || "Others";
    // Try to derive from logged-in `user` object if available (login stores `user` in sessionStorage)
    if (stored === "Others" && typeof window !== "undefined") {
      try {
        const raw =
          sessionStorage.getItem("user") || localStorage.getItem("user");
        if (raw) {
          const parsed = JSON.parse(raw);
          const b =
            parsed?.business?.business_type || parsed?.business_type || null;
          if (b) {
            stored = b;
            try {
              sessionStorage.setItem("business_type", b);
            } catch (e) {
              /* ignore */
            }
          }
        }
      } catch (e) {
        // ignore parse errors
      }
    }
    const list = map[stored] || map["Others"];
    return list.map((name, i) => ({ id: `fb-${i}`, name }));
  };

  const normalizeCategories = (cats) =>
    cats.map((c, i) => ({ id: c.id || `p-${i}`, name: c.name || c }));

  const effectiveCategories = (() => {
    // Prefer businessType mapping when available — it reflects the store's
    // predefined categories. Only fall back to passed `categories` when
    // businessType is not known.
    if (businessType) {
      const fb = getFallbackCategories();
      try {
        console.debug(
          "ProductForm: using fallback categories for businessType=",
          businessType,
          fb
        );
      } catch (e) {}
      return fb;
    }

    if (categories && categories.length > 0) {
      const first = categories[0];
      const firstName = first && (first.name || first);
      // If categories only contains a generic value, fallback
      if (
        categories.length === 1 &&
        (firstName === "General" || firstName === "Others")
      ) {
        const fb = getFallbackCategories();
        try {
          console.debug(
            "ProductForm: categories prop is generic, using fallback=",
            fb
          );
        } catch (e) {}
        return fb;
      }
      const norm = normalizeCategories(categories);
      try {
        console.debug("ProductForm: using provided categories=", norm);
      } catch (e) {}
      return norm;
    }

    const fb = getFallbackCategories();
    try {
      console.debug("ProductForm: no categories provided, using fallback=", fb);
    } catch (e) {}
    return fb;
  })();

  // Validation function to check if all required fields are filled
  const isFormValid = () => {
    // Required fields for adding a product
    const sku = (productForm.sku?.trim() || "").trim();
    const name = (productForm.name?.trim() || "").trim();
    const description = (productForm.description?.trim() || "").trim(); // Optional
    const category = productForm.category || "";
    const quantity = productForm.quantity;
    const costPrice = Number(productForm.cost_price);
    const sellingPrice = Number(productForm.selling_price);
    const productSoldBy = productForm.product_sold_by || "Per Piece";

    // Check if all required text fields have values (description is optional)
    if (!sku || !name || !category) {
      return false;
    }

    // If category is "Others", customCategory is also required
    if (category === "Others") {
      const customCategory = (productForm.customCategory?.trim() || "").trim();
      if (!customCategory) {
        return false;
      }
    }

    // For weight/volume products, unit_size and unit are required
    if (productSoldBy === "By Weight" || productSoldBy === "By Volume") {
      const unitSize = Number(productForm.unit_size);
      const unit = productForm.unit || "";
      if (isNaN(unitSize) || unitSize <= 0 || !unit) {
        return false;
      }
    }

    // For new products, quantity must be provided and > 0
    if (!editingProduct) {
      const qty = Number(quantity);
      if (quantity === "" || quantity === null || quantity === undefined || isNaN(qty) || qty <= 0) {
        return false;
      }
    }

    // Cost price and selling price must be valid numbers > 0
    if (isNaN(costPrice) || costPrice <= 0 || isNaN(sellingPrice) || sellingPrice <= 0) {
      return false;
    }

    // Selling price must be >= cost price
    if (sellingPrice < costPrice) {
      return false;
    }

    return true;
  };

  const formIsValid = isFormValid();

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 flex items-start gap-3 shadow-sm mb-4">
          <div className="flex-shrink-0">
            <svg
              className="w-5 h-5 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-red-800 mb-1">
              {error.includes("already exists") || error.includes("SKU") 
                ? "Duplicate Product" 
                : "Error"}
            </h3>
            <p className="text-sm text-red-700">
              {error}
            </p>
            {error.includes("already exists") && (
              <p className="text-xs text-red-600 mt-2 italic">
                Please use a different SKU code or update the existing product instead.
              </p>
            )}
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onChange) {
                onChange({ target: { name: 'clearError', value: '' } });
              }
            }}
            className="flex-shrink-0 text-red-400 hover:text-red-600 transition-colors"
            aria-label="Close error"
            type="button"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      <form onSubmit={onSubmit} className="space-y-4">
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
          />
        </div>
      </div>
      {scannerOpen && (
        <div className="rounded-2xl border border-blue-100 p-4">
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
      <FormField
        label="Name"
        name="name"
        value={productForm.name}
        onChange={onChange}
        required
      />
      <div>
        <label className="block mb-1 text-sm text-gray-700 font-medium">
          Category <span className="text-red-500">*</span>
        </label>
        <select
          name="category"
          value={productForm.category}
          onChange={onChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        >
          <option value="">Select category</option>
          {effectiveCategories.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
        {productForm.category === "Others" && (
          <div className="mt-2">
            <FormField
              label="Custom Category"
              name="customCategory"
              value={productForm.customCategory || ""}
              onChange={onChange}
              placeholder="Please specify category"
              required
            />
          </div>
        )}
      </div>
      <FormField
        label="Description"
        name="description"
        value={productForm.description}
        onChange={onChange}
        placeholder="Product description (optional)"
      />
      
      {/* Product Unit Configuration */}
      <div>
        <label className="block mb-1 text-sm text-gray-700 font-medium">
          Product Sold By <span className="text-red-500">*</span>
        </label>
        <select
          name="product_sold_by"
          value={productForm.product_sold_by || "Per Piece"}
          onChange={onChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        >
          <option value="Per Piece">Per Piece</option>
          <option value="By Weight">By Weight</option>
          <option value="By Volume">By Volume</option>
        </select>
      </div>
      
      {/* Unit Size and Unit Selector - Only for Weight/Volume */}
      {(productForm.product_sold_by === "By Weight" || productForm.product_sold_by === "By Volume") && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label="Unit Size"
            name="unit_size"
            type="number"
            value={productForm.unit_size || ""}
            onChange={onChange}
            placeholder={productForm.product_sold_by === "By Weight" ? "e.g., 20" : "e.g., 350"}
            required
            min="0.01"
            step="0.01"
          />
          <div>
            <label className="block mb-1 text-sm text-gray-700 font-medium">
              Unit <span className="text-red-500">*</span>
            </label>
            <select
              name="unit"
              value={productForm.unit || (productForm.product_sold_by === "By Weight" ? "g" : "mL")}
              onChange={onChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              {productForm.product_sold_by === "By Weight" ? (
                <>
                  <option value="g">Grams (g)</option>
                  <option value="kg">Kilograms (kg)</option>
                </>
              ) : (
                <>
                  <option value="mL">Milliliters (mL)</option>
                  <option value="L">Liters (L)</option>
                </>
              )}
            </select>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {!editingProduct && (
          <FormField
            label="Quantity"
            name="quantity"
            type="number"
            value={productForm.quantity}
            onChange={onChange}
            required
          />
        )}
        <FormField
          label="Cost Price"
          name="cost_price"
          type="number"
          value={productForm.cost_price}
          onChange={onChange}
          required
        />
        <FormField
          label="Selling Price"
          name="selling_price"
          type="number"
          value={productForm.selling_price}
          onChange={onChange}
          required
        />
        <FormField
          label="Low Stock Level"
          name="low_stock_level"
          type="number"
          value={productForm.low_stock_level}
          onChange={onChange}
          placeholder="10"
          min="0"
        />
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <Button
          label="Cancel"
          variant="secondary"
          onClick={onClose}
          type="button"
        />
        <Button
          label={editingProduct ? "Update" : "Add"}
          variant="primary"
          type="submit"
          disabled={loading || !formIsValid}
        />
      </div>
      {loading && <Loader size="sm" className="mt-2" />}
      </form>
    </div>
  );
}

/**
 * Modal Component
 * Enhanced modal with product form variant
 */
function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  variant = "glass",
  // Product Modal Props
  editingProduct,
  productForm,
  onChange,
  categories,
  onSubmit,
  loading,
  error,
  // Stock Modal Props
  stockForm,
}) {
  if (!isOpen) return null;

  const [businessType, setBusinessType] = useState(null);

  useEffect(() => {
    if (!isOpen || variant !== "product") return;

    const loadBusinessType = async () => {
      try {
        let bid =
          (typeof window !== "undefined" &&
            (localStorage.getItem("business_id") ||
              sessionStorage.getItem("business_id"))) ||
          null;
        // If business_id key not set, try to read from stored `user` object
        if (!bid && typeof window !== "undefined") {
          try {
            const raw =
              sessionStorage.getItem("user") || localStorage.getItem("user");
            if (raw) {
              const parsed = JSON.parse(raw);
              bid = parsed?.businessId || parsed?.business_id || null;
            }
          } catch (e) {
            bid = null;
          }
        }
        if (!bid) {
          console.debug(
            "Modal: no business id available to fetch business_type"
          );
          return;
        }
        console.debug("Modal: loading business_type for business_id=", bid);
        const { data, error } = await supabase
          .from("business")
          .select("business_type")
          .eq("business_id", bid)
          .maybeSingle();
        if (error) {
          console.debug(
            "Could not fetch business_type:",
            error.message || error
          );
          return;
        }
        const btype = data?.business_type || null;
        if (btype) {
          console.debug("Modal: got business_type=", btype);
          setBusinessType(btype);
          try {
            sessionStorage.setItem("business_type", btype);
          } catch (e) {
            /* ignore */
          }
        }
      } catch (err) {
        console.error(err);
      }
    };

    loadBusinessType();
  }, [isOpen, variant]);

  // content is rendered inline below based on `variant`

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      ></div>
      {/* Modal content */}
      <div
        className={`relative bg-white rounded-2xl shadow-2xl min-w-[340px] max-w-full z-10 max-h-[90vh] overflow-hidden flex flex-col ${
          size === "sm"
            ? "w-full max-w-md"
            : size === "lg"
            ? "w-full max-w-4xl"
            : "w-full max-w-xl"
        }`}
      >
        {/* Exit button */}
        <button
          className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
          onClick={onClose}
          aria-label="Close"
          type="button"
        >
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Scrollable content */}
        <div className="overflow-y-auto">
          {title && (
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            </div>
          )}
          {variant === "product" ? (
            <div className="p-6">
              <ProductForm
                editingProduct={editingProduct}
                productForm={productForm}
                onChange={onChange}
                categories={categories || []}
                businessType={businessType}
                onSubmit={onSubmit}
                loading={loading}
                onClose={onClose}
                error={error}
              />
            </div>
          ) : variant === "stock" ? (
            <div className="p-6">
              <StockForm
                stockForm={stockForm}
                onChange={onChange}
                onSubmit={onSubmit}
                loading={loading}
                onClose={onClose}
              />
            </div>
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
}

export default Modal;
