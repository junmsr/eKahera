import React, { useState } from 'react';
import Button from '../common/Button';
import FormField from '../common/FormField';
import Loader from '../common/Loader';
import ScannerCard from '../ui/POS/ScannerCard';

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
  onClose 
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
            label={scannerOpen ? 'Close Scanner' : 'Scan Barcode'}
            type="button"
            variant="secondary"
            onClick={() => setScannerOpen(!scannerOpen)}
          />
        </div>
      </div>
      {scannerOpen && (
        <div className="rounded-2xl border border-blue-100 p-4">
          <ScannerCard
            onScan={result => {
              const code = result?.[0]?.rawValue || '';
              if (code) {
                onChange({ target: { name: 'sku', value: code } });
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
      <FormField
        label="Category"
        name="category"
        value={productForm.category}
        onChange={onChange}
        list="category-list"
        required
      />
      <datalist id="category-list">
        {categories.map((c) => <option key={c.id} value={c.name} />)}
      </datalist>
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
        <Button label="Cancel" variant="secondary" onClick={onClose} type="button" />
        <Button label={editingProduct ? 'Update' : 'Add'} variant="primary" type="submit" disabled={loading} />
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
  className = '',
  size = 'md',
  variant = 'glass',
  // Product Modal Props
  editingProduct,
  productForm,
  onChange,
  categories,
  onSubmit,
  loading
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Blurred background */}
      <div className="absolute inset-0 backdrop-blur-sm pointer-events-none"></div>
      {/* Modal content */}
      <div className={`relative bg-white rounded-2xl shadow-lg p-8 min-w-[340px] z-10 w-full ${className}`}>
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
        {children}
      </div>
    </div>
  );
}

export default Modal;
