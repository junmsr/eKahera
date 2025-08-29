import React, { useState, useMemo, useEffect } from 'react';
import PageLayout from '../components/layout/PageLayout';
import NavAdmin from '../components/layout/Nav-Admin';
import Inventory from '../components/inventory/Inventory';
import Modal from '../components/modals/Modal';
import { api, authHeaders } from '../lib/api';

const initialProducts = [];
const initialCategories = [
  { id: 1, name: 'Category QQ' },
  { id: 2, name: 'CategoryTest' },
  { id: 3, name: 'CategoryTwo' },
  { id: 4, name: 'CRMB99 QQ' },
  { id: 5, name: 'Category Three' },
  { id: 6, name: 'Category One' },
];

export default function InventoryPage() {
  // State
  const [products, setProducts] = useState(initialProducts);
  const [categories] = useState(initialCategories);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({ id: '', name: '', category: '', description: '', quantity: '', price: '' });
  const [stockForm, setStockForm] = useState({ sku: '', quantity: '' });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [apiError, setApiError] = useState('');

  // Load inventory from API
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        setApiError('');
        const token = localStorage.getItem('auth_token');
        const data = await api('/api/inventory', { headers: authHeaders(token) });
        // Map backend rows to UI shape
        const mapped = (data || []).map((row) => ({
          id: String(row.product_id ?? row.inventory_id ?? ''),
          name: row.product_name || '-',
          category: '-',
          description: '-',
          quantity: Number(row.quantity_in_stock ?? 0),
          price: Number(row.selling_price ?? 0),
        }));
        setProducts(mapped);
      } catch (err) {
        setApiError(err.message || 'Failed to load inventory');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, []);

  // Stats (mocked)
  const stats = [
    { label: 'TOTAL ITEMS', value: products.length, icon: <span className="material-icons">inventory_2</span>, color: 'text-blue-800' },
    { label: 'TOTAL SALES', value: products.length, icon: <span className="material-icons">attach_money</span>, color: 'text-green-700' },
    { label: 'AVAILABLE CATEGORIES', value: categories.length, icon: <span className="material-icons">category</span>, color: 'text-blue-500' },
    { label: 'USERS', value: 3, icon: <span className="material-icons">group</span>, color: 'text-blue-400' },
  ];

  // Filtering and pagination
  const filteredProducts = useMemo(() => {
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase())
    );
  }, [products, search]);
  const totalPages = Math.ceil(filteredProducts.length / entriesPerPage) || 1;
  const paginatedProducts = filteredProducts.slice((page - 1) * entriesPerPage, page * entriesPerPage);

  // Handlers
  const openAddProduct = () => {
    setEditingProduct(null);
    setProductForm({ id: '', name: '', category: '', description: '', quantity: '', price: '' });
    setShowProductModal(true);
  };
  const openEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({ ...product });
    setShowProductModal(true);
  };
  const openStockEntry = (product) => {
    setStockForm({ sku: product?.sku || '', quantity: '' });
    setShowStockModal(true);
  };
  const handleProductFormChange = (e) => {
    const { name, value } = e.target;
    setProductForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setApiError('');
      const token = localStorage.getItem('auth_token');
      await api('/api/products', {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({
          product_category_id: null,
          product_name: productForm.name,
          cost_price: Number(productForm.price) || 0,
          selling_price: Number(productForm.price) || 0,
          sku: productForm.id || `SKU-${Date.now()}`,
        }),
      });
      // refresh
      const data = await api('/api/inventory', { headers: authHeaders(token) });
      const mapped = (data || []).map((row) => ({
        id: String(row.product_id ?? row.inventory_id ?? ''),
        name: row.product_name || '-',
        category: '-',
        description: '-',
        quantity: Number(row.quantity_in_stock ?? 0),
        price: Number(row.selling_price ?? 0),
        sku: row.sku || '',
      }));
      setProducts(mapped);
      setShowProductModal(false);
    } catch (err) {
      setApiError(err.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const handleStockSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setApiError('');
      const token = localStorage.getItem('auth_token');
      await api('/api/products/add-stock-by-sku', {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ sku: stockForm.sku, quantity: Number(stockForm.quantity) })
      });
      const data = await api('/api/inventory', { headers: authHeaders(token) });
      const mapped = (data || []).map((row) => ({
        id: String(row.product_id ?? row.inventory_id ?? ''),
        name: row.product_name || '-',
        category: '-',
        description: '-',
        quantity: Number(row.quantity_in_stock ?? 0),
        price: Number(row.selling_price ?? 0),
        sku: row.sku || '',
      }));
      setProducts(mapped);
      setShowStockModal(false);
    } catch (err) {
      setApiError(err.message || 'Failed to add stock');
    } finally {
      setLoading(false);
    }
  };
  const handleDeleteProduct = (id) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
  };
  const handleEntriesChange = (e) => {
    setEntriesPerPage(Number(e.target.value));
    setPage(1);
  };
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  return (
    <PageLayout title={null} sidebar={<NavAdmin />} showHeader={false} showNavbar={false} showFooter={false}>
      <Inventory
        products={paginatedProducts}
        stats={stats}
        page={page}
        entriesPerPage={entriesPerPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        onEntriesChange={handleEntriesChange}
        search={search}
        onSearchChange={handleSearchChange}
        onEdit={openEditProduct}
        onDelete={handleDeleteProduct}
        onAddProduct={openAddProduct}
        onStockEntry={openStockEntry}
      />
      {apiError && (
        <div className="text-red-600 text-sm mt-2 px-4">{apiError}</div>
      )}
      <Modal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        title={editingProduct ? 'Update Product' : 'Add Product'}
        variant="product"
        editingProduct={editingProduct}
        productForm={productForm}
        onChange={handleProductFormChange}
        categories={categories}
        onSubmit={handleProductSubmit}
        loading={loading}
      />
      {/* Stock Entry Modal (simple) */}
      <Modal
        isOpen={showStockModal}
        onClose={() => setShowStockModal(false)}
        title={'Stock Entry'}
        variant="product"
        editingProduct={null}
        productForm={stockForm}
        onChange={(e) => setStockForm({ ...stockForm, [e.target.name]: e.target.value })}
        categories={[]}
        onSubmit={handleStockSubmit}
        loading={loading}
      />
    </PageLayout>
  );
}
