import React from 'react';
import Button from '../common/Button';
import FormField from '../common/FormField';
import Loader from '../common/Loader';

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
  return (
    <form onSubmit={onSubmit} className="space-y-4">
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
      <FormField
        label="Quantity"
        name="quantity"
        type="number"
        value={productForm.quantity}
        onChange={onChange}
        required
      />
      <FormField
        label="Price"
        name="price"
        type="number"
        value={productForm.price}
        onChange={onChange}
        required
      />
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
  
  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
  };
  
  const variants = {
    glass: 'bg-white/60 backdrop-blur-xl border border-white/30',
    dark: 'bg-gray-900/90 text-white',
    default: 'bg-white',
  };

  // Determine content based on variant
  let modalContent = children;
  if (variant === 'product') {
    modalContent = (
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
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity duration-200" role="dialog" aria-modal="true">
      <div className={`${variants[variant]} rounded-3xl shadow-2xl p-8 w-full ${sizes[size]} relative animate-fadeIn`}>
        {title && <h3 className="text-2xl font-bold mb-4 tracking-tight text-blue-900 drop-shadow">{title}</h3>}
        <Button
          onClick={onClose}
          isCloseButton={true}
          aria-label="Close"
        />
        {modalContent}
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.3s; }
      `}</style>
    </div>
  );
}

export default Modal;
