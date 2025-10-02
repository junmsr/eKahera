import React, { useState } from "react";
import Button from "../common/Button";
import FormField from "../common/FormField";
import Loader from "../common/Loader";
import ScannerCard from "../ui/POS/ScannerCard";

/**
 * Stock Form Component
 * Internal component for stock entry form
 */
function StockForm({ stockForm, onChange, onSubmit, loading, onClose }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {!(stockForm?.sku) && (
        <FormField
          label="SKU Code"
          name="sku"
          value={stockForm?.sku || ''}
          onChange={onChange}
          placeholder="Enter SKU"
        />
      )}
      <FormField
        label="Quantity to Add"
        name="quantity"
        type="number"
        value={stockForm?.quantity || ''}
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
}) {
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerPaused, setScannerPaused] = useState(false);
  return (
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
          <option value="Food & Beverages">Food & Beverages</option>
          <option value="Electronics">Electronics</option>
          <option value="Clothing & Apparel">Clothing & Apparel</option>
          <option value="Health & Beauty">Health & Beauty</option>
          <option value="Home & Garden">Home & Garden</option>
          <option value="Sports & Outdoors">Sports & Outdoors</option>
          <option value="Books & Media">Books & Media</option>
          <option value="Toys & Games">Toys & Games</option>
          <option value="Automotive">Automotive</option>
          <option value="Office Supplies">Office Supplies</option>
          <option value="Pet Supplies">Pet Supplies</option>
          <option value="Jewelry & Accessories">Jewelry & Accessories</option>
          <option value="Hardware & Tools">Hardware & Tools</option>
          <option value="Baby & Kids">Baby & Kids</option>
          <option value="Pharmacy">Pharmacy</option>
          <option value="Grocery">Grocery</option>
          <option value="Others">Others</option>
          {categories.map((c) => (
            <option key={c.id} value={c.name}>{c.name}</option>
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
        required
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField
          label="Quantity"
          name="quantity"
          type="number"
          value={productForm.quantity}
          onChange={onChange}
          required
        />
        <FormField
          label="Cost Price (₱)"
          name="cost_price"
          type="number"
          value={productForm.cost_price}
          onChange={onChange}
          required
        />
        <FormField
          label="Selling Price (₱)"
          name="selling_price"
          type="number"
          value={productForm.selling_price}
          onChange={onChange}
          required
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
          disabled={loading}
        />
      </div>
      {loading && <Loader size="sm" className="mt-2" />}
    </form>
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
  size = 'md',
  variant = 'glass',
  // Product Modal Props
  editingProduct,
  productForm,
  onChange,
  categories,
  onSubmit,
  loading,
  // Stock Modal Props
  stockForm,
}) {
  if (!isOpen) return null;

  let content;
  if (variant === "product") {
    content = (
      <ProductForm
        editingProduct={editingProduct}
        productForm={productForm}
        onChange={onChange}
        categories={categories}
        onSubmit={onSubmit}
        loading={loading}
        onClose={onClose}
      />
    );
  } else if (variant === "stock") {
    content = (
      <StockForm
        stockForm={stockForm}
        onChange={onChange}
        onSubmit={onSubmit}
        loading={loading}
        onClose={onClose}
      />
    );
  } else {
    content = children;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Blurred background */}
      <div className="absolute inset-0 backdrop-blur-sm pointer-events-none"></div>
      {/* Modal content */}
      <div
        className={`relative bg-white rounded-2xl shadow-lg p-8 min-w-[340px] z-10 max-h-[90vh] overflow-y-auto`}
      >
        {/* Exit button */}
        <button
          className="absolute top-4 right-4 text-2xl text-gray-400 hover:text-blue-600 focus:outline-none"
          onClick={onClose}
          aria-label="Close"
          type="button"
        >
          ×
        </button>

        {title && <h2 className="text-xl font-bold mb-6 text-blue-700">{title}</h2>}
        {variant === 'product' ? (
          <ProductForm
            editingProduct={editingProduct}
            productForm={productForm}
            onChange={onChange}
            categories={categories || []}
            onSubmit={onSubmit}
            loading={loading}
            onClose={onClose}
          />
        ) : variant === 'stock' ? (
          <StockForm
            stockForm={stockForm}
            onChange={onChange}
            onSubmit={onSubmit}
            loading={loading}
            onClose={onClose}
          />
        ) : (
          children
        )}
      </div>
    </div>
  );
}

export default Modal;
