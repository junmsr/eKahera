import React, { useState, useMemo, useEffect } from "react";
import PageLayout from "../components/layout/PageLayout";
import NavAdmin from "../components/layout/Nav-Admin";
import Inventory from "../components/inventory/Inventory";
import Modal from "../components/modals/Modal";
import ProductFormModal from "../components/modals/ProductFormModal";
import { api, authHeaders } from "../lib/api";

const initialProducts = [];
const initialCategories = [];

// Function to get predefined categories based on business type
function getCategoriesByBusinessType(businessType) {
  const categoryMap = {
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

  return categoryMap[businessType] || categoryMap["Others"];
}

export default function InventoryPage() {
  // State
  const [products, setProducts] = useState(initialProducts);
  const [categories, setCategories] = useState(() => {
    try {
      let storedType = null;
      try {
        storedType =
          (typeof window !== "undefined" &&
            sessionStorage.getItem("business_type")) ||
          null;
      } catch (e) {
        storedType = null;
      }
      // Fallback: try `user` object saved at login
      if (!storedType && typeof window !== "undefined") {
        try {
          const raw =
            sessionStorage.getItem("user") || localStorage.getItem("user");
          if (raw) {
            const parsed = JSON.parse(raw);
            storedType =
              parsed?.business?.business_type || parsed?.business_type || null;
            if (storedType) {
              try {
                sessionStorage.setItem("business_type", storedType);
              } catch (e) {
                /* ignore */
              }
            }
          }
        } catch (e) {
          storedType = null;
        }
      }
      storedType = storedType || "Others";
      const list = getCategoriesByBusinessType(storedType) || [];
      return list.map((name, index) => ({ id: index + 1, name }));
    } catch {
      return initialCategories;
    }
  });
  const [showProductModal, setShowProductModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
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
  });
  const [stockForm, setStockForm] = useState({ sku: "", quantity: "" });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [apiError, setApiError] = useState("");
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // Load inventory and business type from API
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        setApiError("");
        const token = sessionStorage.getItem("auth_token");

        // Fetch business type
        const userData = await api("/api/auth/profile", {
          headers: authHeaders(token),
        });
        const businessType = userData?.business?.business_type || "Others";
        // persist business type so modals can use it before API completes
        try {
          if (typeof window !== "undefined")
            sessionStorage.setItem("business_type", businessType);
        } catch (storageErr) {
          // ignore storage errors (e.g. private mode)

          console.debug("Could not persist business_type", storageErr);
        }

        // Set predefined categories based on business type
        const predefinedCategories = getCategoriesByBusinessType(businessType);
        setCategories(
          predefinedCategories.map((name, index) => ({
            id: index + 1,
            name: name,
          }))
        );

        // Fetch inventory
        const data = await api("/api/inventory", {
          headers: authHeaders(token),
        });

        // Map backend rows to UI shape with correct column mapping
        const mapped = (data || []).map((row) => ({
          id: String(row.id || ""),
          name: row.name || "-",
          category: row.category || "-",
          quantity: Number(row.quantity || 0),
          cost_price: Number(row.cost_price || 0),
          selling_price: Number(row.selling_price || 0),
          sku: row.sku || "",
          description: row.description || "",
        }));
        setProducts(mapped);
      } catch (err) {
        setApiError("Failed to load inventory");
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, []);

  // Stats
  const totalInventoryValue = products.reduce(
    (sum, p) => sum + Number(p.selling_price || 0) * Number(p.quantity || 0),
    0
  );
  const lowStockItems = products.filter(
    (p) => Number(p.quantity || 0) < 10
  ).length;

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

  // Additional filter states (will be handled by Inventory component)
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
          return qty > 0 && qty < 10;
        });
      } else if (stockFilter === "in_stock") {
        filtered = filtered.filter((p) => Number(p.quantity || 0) >= 10);
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
  const openAddProduct = () => {
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
    });
    setShowProductModal(true);
  };

  const openEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({ ...product });
    setShowProductModal(true);
  };

  const openStockEntry = (product) => {
    setStockForm({ sku: product?.sku || "", quantity: "" });
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
      setApiError("");
      const token = sessionStorage.getItem("auth_token");

      if (editingProduct) {
        // Update existing product
        await api(`/api/inventory/${editingProduct.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders(token),
          },
          body: JSON.stringify({
            product_name: (productForm.name || "").trim(),
            cost_price: Number(productForm.cost_price) || 0,
            selling_price: Number(productForm.selling_price) || 0,
            sku: (productForm.sku || "").trim(),
            category:
              productForm.category === "Others"
                ? (productForm.customCategory || "").trim()
                : (productForm.category || "").trim(),
            description: (productForm.description || "").trim(),
          }),
        });
      } else {
        // Create new product
        await api("/api/products", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders(token),
          },
          body: JSON.stringify({
            product_category_id: null,
            category:
              productForm.category === "Others"
                ? (productForm.customCategory || "").trim()
                : (productForm.category || "").trim(),
            product_name: (productForm.name || "").trim(),
            name: (productForm.name || "").trim(),
            description: (productForm.description || "").trim(),
            cost_price: Number(productForm.cost_price) || 0,
            selling_price: Number(productForm.selling_price) || 0,
            price: Number(productForm.selling_price) || 0,
            sku: (productForm.sku || "").trim() || `SKU-${Date.now()}`,
            quantity: Number(productForm.quantity) || 0,
          }),
        });
      }

      // Refresh inventory list after creation/update
      const data = await api("/api/inventory", { headers: authHeaders(token) });
      const mapped = (data || []).map((row) => ({
        id: String(row.id || ""),
        name: row.name || "-",
        category: row.category || "-",
        quantity: Number(row.quantity || 0),
        cost_price: Number(row.cost_price || 0),
        selling_price: Number(row.selling_price || 0),
        sku: row.sku || "",
        description: row.description || "",
      }));
      setProducts(mapped);
      setShowProductModal(false);
    } catch (err) {
      setApiError("Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  const handleStockSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setApiError("");
      const token = sessionStorage.getItem("auth_token");
      await api("/api/products/add-stock-by-sku", {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({
          sku: stockForm.sku,
          quantity: Number(stockForm.quantity),
        }),
      });
      const data = await api("/api/inventory", { headers: authHeaders(token) });
      const mapped = (data || []).map((row) => ({
        id: String(row.id || ""),
        name: row.name || "-",
        category: row.category || "-",
        quantity: Number(row.quantity || 0),
        cost_price: Number(row.cost_price || 0),
        selling_price: Number(row.selling_price || 0),
        sku: row.sku || "",
        description: row.description || "",
      }));
      setProducts(mapped);
      setShowStockModal(false);
    } catch (err) {
      setApiError("Failed to add stock");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?"))
      return;

    try {
      setLoading(true);
      setApiError("");
      const token = sessionStorage.getItem("auth_token");
      await api(`/api/inventory/${id}`, {
        method: "DELETE",
        headers: authHeaders(token),
      });

      // Refresh inventory list after deletion
      const data = await api("/api/inventory", { headers: authHeaders(token) });
      const mapped = (data || []).map((row) => ({
        id: String(row.id || ""),
        name: row.name || "-",
        category: row.category || "-",
        quantity: Number(row.quantity || 0),
        cost_price: Number(row.cost_price || 0),
        selling_price: Number(row.selling_price || 0),
        sku: row.sku || "",
        description: row.description || "",
      }));
      setProducts(mapped);
    } catch (err) {
      setApiError("Failed to delete product");
    } finally {
      setLoading(false);
    }
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
    <PageLayout
      title="INVENTORY"
      sidebar={<NavAdmin />}
      isSidebarOpen={isSidebarOpen}
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
        onStockEntry={openStockEntry}
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryFilter={(category) => {
          setSelectedCategory(category);
          setPage(1); // Reset to first page on filter change
        }}
        stockFilter={stockFilter}
        onStockFilter={(filter) => {
          setStockFilter(filter);
          setPage(1); // Reset to first page on filter change
        }}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={(field, order) => {
          setSortBy(field);
          setSortOrder(order);
          setPage(1); // Reset to first page on sort
        }}
      />
      {apiError && (
        <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-3 flex items-start gap-2 mt-2">
          <svg
            className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5"
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
          <p className="text-sm font-medium text-red-700">
            {(() => {
              try {
                const parsed = JSON.parse(apiError);
                return parsed.error || parsed.message || apiError;
              } catch {
                return apiError;
              }
            })()}
          </p>
        </div>
      )}
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
      {/* Stock Entry Modal */}
      <Modal
        isOpen={showStockModal}
        onClose={() => setShowStockModal(false)}
        title={"Stock Entry"}
        variant="stock"
        editingProduct={null}
        stockForm={stockForm}
        onChange={(e) =>
          setStockForm({ ...stockForm, [e.target.name]: e.target.value })
        }
        onSubmit={handleStockSubmit}
        loading={loading}
      />
    </PageLayout>
  );
}
