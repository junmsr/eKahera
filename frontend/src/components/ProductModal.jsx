import React from 'react';
import Modal from './Modal';
import FormField from './FormField';
import Button from './Button';
import Loader from './Loader';

export default function ProductModal({
  isOpen,
  onClose,
  onSubmit,
  loading,
  editingProduct,
  productForm,
  onChange,
  categories,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingProduct ? 'Update Product' : 'Add Product'}>
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
    </Modal>
  );
} 