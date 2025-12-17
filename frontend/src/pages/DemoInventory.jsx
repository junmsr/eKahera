import React, { useState, useMemo, useEffect, useCallback } from "react";
import PageLayout from "../components/layout/PageLayout";
import DemoNav from "../components/layout/DemoNav";
import Inventory from "../components/inventory/Inventory";
import Modal from "../components/modals/Modal";
import Button from "../components/common/Button";

const initialProducts = [
  {
    id: "1",
    name: "Premium Coffee Beans",
    sku: "PCB-001",
    category: "Beverages",
    description: "High-quality arabica coffee beans",
    quantity: 150,
    cost_price: 250.0,
    selling_price: 350.0,
    low_stock_level: 20,
  },
  {
    id: "2",
    name: "Organic Milk",
    sku: "OM-002",
    category: "Dairy",
    description: "Fresh organic whole milk",
    quantity: 75,
    cost_price: 45.0,
    selling_price: 65.0,
    low_stock_level: 15,
  },
  {
    id: "3",
    name: "Chocolate Croissant",
    sku: "CC-003",
    category: "Bakery",
    description: "Buttery pastry with chocolate filling",
    quantity: 25,
    cost_price: 35.0,
    selling_price: 55.0,
    low_stock_level: 10,
  },
  {
    id: "4",
    name: "Green Tea Bags",
    sku: "GTB-004",
    category: "Beverages",
    description: "Premium green tea in convenient bags",
    quantity: 200,
    cost_price: 15.0,
    selling_price: 25.0,
    low_stock_level: 30,
  },
  {
    id: "5",
    name: "Vanilla Syrup",
    sku: "VS-005",
    category: "Condiments",
    description: "Pure vanilla flavor syrup",
    quantity: 8,
    cost_price: 120.0,
    selling_price: 180.0,
    low_stock_level: 10,
  },
];

const initialCategories = [
  { id: 1, name: "Beverages" },
  { id: 2, name: "Dairy" },
  { id: 3, name: "Bakery" },
  { id: 4, name: "Condiments" },
  { id: 5, name: "Snacks" },
];

const DEFAULT_LOW_STOCK_LEVEL = 10;

export default function DemoInventoryPage() {
  // State
  const [products, setProducts] = useState(initialProducts);
  const [categories] = useState(initialCategories);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    sku: "",
    name: "",
    category: "",
    customCategory: "",
    description: "",
    quantity: "",
    cost_price: "",
    selling_price: "",
    low_stock_level: DEFAULT_LOW_STOCK_LEVEL,
  });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  // Stats
  const totalInventoryValue = products.reduce(
    (sum, p) => sum + Number(p.selling_price || 0) * Number(p.quantity || 0),
    0
  );
  const lowStockItems = products.filter((p) => {
    const threshold = Number(p.low_stock_level ?? DEFAULT_LOW_STOCK_LEVEL);
    return Number(p.quantity || 0) < threshold;
  }).length;

  const stats = [
    {
      label: "TOTAL ITEMS",
      value: products.length,
      icon: (
        <svg
          width="32"
          height="32"
          fill="none"
          stroke="#2563eb"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      color: "text-blue-800",
      sub: "Total products in inventory",
    },
    {
      label: "INVENTORY VALUE",
      value: totalInventoryValue,
      icon: (
        <svg
          width="32"
          height="32"
          fill="none"
          stroke="#2563eb"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "text-green-700",
      formatValue: (val) =>
        `₱${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      sub: "Total value of all stock",
    },
    {
      label: "AVAILABLE CATEGORIES",
      value: categories.length,
      icon: (
        <svg
          width="32"
          height="32"
          fill="none"
          stroke="#2563eb"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      ),
      color: "text-blue-500",
      sub: "Product categories",
    },
    {
      label: "LOW STOCK ALERTS",
      value: lowStockItems,
      icon: (
        <svg
          width="32"
          height="32"
          fill="none"
          stroke="#2563eb"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      color: "text-orange-600",
      sub: "Items needing restock",
    },
  ];

  // Additional filter states
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [stockFilter, setStockFilter] = useState(null);

  // Filtering, sorting and pagination
  const filteredProducts = useMemo(() => {
    let filtered = products.filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase())
    );

    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    // Apply stock filter
    if (stockFilter) {
      if (stockFilter === "out_of_stock") {
        filtered = filtered.filter((p) => Number(p.quantity || 0) === 0);
      } else if (stockFilter === "low_stock") {
        filtered = filtered.filter((p) => {
          const qty = Number(p.quantity || 0);
          const threshold = Number(
            p.low_stock_level ?? DEFAULT_LOW_STOCK_LEVEL
          );
          return qty > 0 && qty < threshold;
        });
      } else if (stockFilter === "in_stock") {
        filtered = filtered.filter((p) => {
          const threshold = Number(
            p.low_stock_level ?? DEFAULT_LOW_STOCK_LEVEL
          );
          return Number(p.quantity || 0) >= threshold;
        });
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal, bVal;
      if (sortBy === "name") {
        aVal = (a.name || "").toLowerCase();
        bVal = (b.name || "").toLowerCase();
      } else if (sortBy === "category") {
        aVal = (a.category || "").toLowerCase();
        bVal = (b.category || "").toLowerCase();
      } else if (sortBy === "quantity") {
        aVal = Number(a.quantity || 0);
        bVal = Number(b.quantity || 0);
      } else if (sortBy === "selling_price") {
        aVal = Number(a.selling_price || 0);
        bVal = Number(b.selling_price || 0);
      } else {
        return 0;
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [products, search, selectedCategory, stockFilter, sortBy, sortOrder]);

  const totalPages = Math.ceil(filteredProducts.length / entriesPerPage) || 1;
  const paginatedProducts = filteredProducts.slice(
    (page - 1) * entriesPerPage,
    page * entriesPerPage
  );

  // Handlers
  const openAddProduct = useCallback(() => {
    setEditingProduct(null);
    setProductForm({
      sku: "",
      name: "",
      category: "",
      customCategory: "",
      description: "",
      quantity: "",
      cost_price: "",
      selling_price: "",
      low_stock_level: DEFAULT_LOW_STOCK_LEVEL,
    });
    setShowProductModal(true);
  }, []);

  const openEditProduct = useCallback((product) => {
    setEditingProduct(product);
    setProductForm({
      ...product,
      low_stock_level:
        typeof product.low_stock_level === "number"
          ? product.low_stock_level
          : DEFAULT_LOW_STOCK_LEVEL,
    });
    setShowProductModal(true);
  }, []);

  const handleProductFormChange = useCallback((e) => {
    const { name, value } = e.target;
    setProductForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleProductSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setLoading(true);
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (editingProduct) {
        // Update existing product
        setProducts((prev) =>
          prev.map((p) =>
            p.id === editingProduct.id
              ? {
                  ...p,
                  ...productForm,
                  quantity: Number(productForm.quantity) || 0,
                  cost_price: Number(productForm.cost_price) || 0,
                  selling_price: Number(productForm.selling_price) || 0,
                  low_stock_level:
                    Number(productForm.low_stock_level) ||
                    DEFAULT_LOW_STOCK_LEVEL,
                }
              : p
          )
        );
      } else {
        // Add new product
        const newProduct = {
          id: String(Date.now()),
          ...productForm,
          quantity: Number(productForm.quantity) || 0,
          cost_price: Number(productForm.cost_price) || 0,
          selling_price: Number(productForm.selling_price) || 0,
          low_stock_level:
            Number(productForm.low_stock_level) || DEFAULT_LOW_STOCK_LEVEL,
        };
        setProducts((prev) => [...prev, newProduct]);
      }
      setShowProductModal(false);
      setLoading(false);
    },
    [editingProduct, productForm]
  );

  const handleDeleteProduct = useCallback(
    (id) => {
      const product = products.find((p) => String(p.id) === String(id));
      if (product) {
        setProductToDelete(product);
        setShowDeleteModal(true);
      }
    },
    [products]
  );

  const confirmDeleteProduct = useCallback(async () => {
    if (!productToDelete) return;
    setLoading(true);
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));
    setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));
    setShowDeleteModal(false);
    setProductToDelete(null);
    setLoading(false);
  }, [productToDelete]);

  const handlePageChange = useCallback(
    (newPage) => {
      if (newPage < 1 || newPage > totalPages) return;
      setPage(newPage);
    },
    [totalPages]
  );

  const handleEntriesChange = useCallback((e) => {
    setEntriesPerPage(Number(e.target.value));
    setPage(1);
  }, []);

  const handleSearchChange = useCallback((e) => {
    setSearch(e.target.value);
    setPage(1);
  }, []);

  const handleExport = useCallback(() => {
    // Simple CSV export for demo
    const csv =
      "Name,SKU,Category,Quantity,Selling Price\n" +
      filteredProducts
        .map(
          (p) =>
            `${p.name},${p.sku},${p.category},${p.quantity},${p.selling_price}`
        )
        .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "demo_inventory.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredProducts]);

  const headerActions = (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 sm:gap-4 mb-4 sm:mb-0 w-full">
      <div className="flex items-center justify-end gap-2 sm:gap-3 w-auto">
        <Button
          onClick={openAddProduct}
          variant="primary"
          microinteraction={true}
          className="bg-blue-600 text-md text-white font-semibold rounded-lg shadow hover:bg-blue-700 transition gap-1 sm:gap-2 flex items-center justify-center sm:justify-start !py-2 !px-2 sm:!px-2 shrink-0 min-w-[40px] sm:min-w-[40px] lg:min-w-0"
        >
          <svg
            className="w-4 h-4"
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
          <span className="hidden sm:block">Add Product</span>
          <span className="sm:inline"></span>
        </Button>

        <Button
          onClick={handleExport}
          variant="secondary"
          className="text-sm flex items-center justify-center sm:justify-start gap-1 sm:gap-2 shrink-0 !py-2 !px-2 sm:!px-2 min-w-[40px] sm:min-w-[40px] lg:min-w-0"
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
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span className="hidden sm:inline">Export</span>
        </Button>
      </div>
    </div>
  );

  return (
    <PageLayout
      title="INVENTORY (DEMO)"
      sidebar={<DemoNav />}
      isSidebarOpen={isSidebarOpen}
      headerActions={headerActions}
      setSidebarOpen={setSidebarOpen}
      showHeader={true}
      showNavbar={false}
      showFooter={false}
    >
      <Inventory
        products={paginatedProducts}
        allProducts={filteredProducts}
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
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryFilter={(category) => {
          setSelectedCategory(category);
          setPage(1);
        }}
        stockFilter={stockFilter}
        onStockFilter={(filter) => {
          setStockFilter(filter);
          setPage(1);
        }}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={(field, order) => {
          setSortBy(field);
          setSortOrder(order);
          setPage(1);
        }}
      />

      <Modal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        variant="product"
        title={editingProduct ? "Edit Product" : "Add New Product"}
        editingProduct={editingProduct}
        productForm={productForm}
        onChange={handleProductFormChange}
        categories={categories}
        onSubmit={handleProductSubmit}
        loading={loading}
      />

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title=""
        size="sm"
      >
        <div className="p-0">
          <div className="bg-gradient-to-r from-red-50 via-red-50/80 to-orange-50/50 border-b border-red-100 px-6 py-5 rounded-t-2xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg
                  className="w-6 h-6 text-white"
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
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  Confirm Deletion
                </h2>
                <p className="text-sm text-gray-600">
                  Are you sure you want to delete this product?
                </p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <p className="text-sm text-gray-700 mb-2">
              You are about to delete:{" "}
              <strong className="text-red-700">{productToDelete?.name}</strong>
            </p>
            <p className="text-sm text-gray-700 mb-6">
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                onClick={() => setShowDeleteModal(false)}
                variant="secondary"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDeleteProduct}
                variant="danger"
                loading={loading}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </PageLayout>
  );
}
