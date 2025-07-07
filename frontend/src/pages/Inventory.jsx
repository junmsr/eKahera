import React, { useState, useMemo } from 'react';
import PageLayout from '../components/PageLayout';
import NavAdmin from '../components/Nav-Admin';
import InventoryStats from '../components/InventoryStats';
import InventoryTable from '../components/InventoryTable';
import ProductModal from '../components/ProductModal';

const initialProducts = [
  { id: '0001', name: 'Test Test', category: 'Category QQ', description: 'This is just a demo test. This is just a demo test.', quantity: 126, price: 38.0 },
  { id: '0002', name: 'Test Item', category: 'CategoryTest', description: 'asdasdasd', quantity: 84, price: 25.0 },
  { id: '0003', name: 'Item XY', category: 'CategoryTwo', description: 'q w qw wv wv !!!!!!!!', quantity: 74, price: 21.0 },
  { id: '0004', name: 'CRMB99 QQ', category: 'CRMB99 QQ', description: 'a a a wv mv sssss', quantity: 17, price: 32.0 },
  { id: '0005', name: 'Test123', category: 'Category Three', description: 'aaaa bbb ccc', quantity: 77, price: 20.0 },
  { id: '0006', name: 'XYZ', category: 'CategoryTest', description: 'ccc abc', quantity: 41, price: 19.0 },
  { id: '0007', name: 'ABC', category: 'Category QQ', description: 'qweqwe qweqwe qweqwe', quantity: 222, price: 31.0 },
  { id: '0008', name: 'Astro', category: 'Category One', description: 'astro test', quantity: 91, price: 88.0 },
  { id: '0009', name: 'TestItem', category: 'CategoryTest', description: 'This is a test. This is a test. This is a test.', quantity: 33, price: 56.0 },
  { id: '0010', name: 'Item Three', category: 'Category One', description: 'qwerty qwerty qwert qwww', quantity: 38, price: 13.0 },
];
const initialCategories = [
  { id: 1, name: 'Category QQ' },
  { id: 2, name: 'CategoryTest' },
  { id: 3, name: 'CategoryTwo' },
  { id: 4, name: 'CRMB99 QQ' },
  { id: 5, name: 'Category Three' },
  { id: 6, name: 'Category One' },
];

export default function Inventory() {
  // State
  const [products, setProducts] = useState(initialProducts);
  const [categories] = useState(initialCategories);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({ id: '', name: '', category: '', description: '', quantity: '', price: '' });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [page, setPage] = useState(1);

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
  const handleProductFormChange = (e) => {
    const { name, value } = e.target;
    setProductForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleProductSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      if (editingProduct) {
        setProducts((prev) =>
          prev.map((p) => (p.id === editingProduct.id ? { ...productForm, quantity: Number(productForm.quantity), price: Number(productForm.price) } : p))
        );
      } else {
        setProducts((prev) => [
          ...prev,
          { ...productForm, id: Date.now().toString(), quantity: Number(productForm.quantity), price: Number(productForm.price) },
        ]);
      }
      setShowProductModal(false);
      setLoading(false);
    }, 500);
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
      <div className="max-w-7xl mx-auto py-8 px-2 md:px-6">
        <InventoryStats stats={stats} />
        <h2 className="text-2xl font-bold text-blue-900 tracking-tight mb-2 md:mb-0">Inventory List</h2>
        <InventoryTable
          products={paginatedProducts}
          page={page}
          entriesPerPage={entriesPerPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          onEntriesChange={handleEntriesChange}
          search={search}
          onSearchChange={handleSearchChange}
          onEdit={openEditProduct}
          onDelete={handleDeleteProduct}
        />
        <div className="flex flex-row gap-6 mt-8 px-2">
          <button onClick={openAddProduct} className="rounded-xl font-bold shadow-md bg-gradient-to-r from-blue-500 to-blue-700 text-white px-8 py-3 text-lg hover:from-blue-600 hover:to-blue-800 hover:scale-105 active:scale-95 transition-all duration-200">
            ADD PRODUCT
          </button>
        </div>
      </div>
      <ProductModal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        onSubmit={handleProductSubmit}
        loading={loading}
        editingProduct={editingProduct}
        productForm={productForm}
        onChange={handleProductFormChange}
        categories={categories}
      />
    </PageLayout>
  );
}
