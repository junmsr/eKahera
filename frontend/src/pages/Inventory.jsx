import React, { useState, useMemo, useEffect, useCallback } from "react";
import PageLayout from "../components/layout/PageLayout";
import NavAdmin from "../components/layout/Nav-Admin";
import Inventory from "../components/inventory/Inventory";
import Modal from "../components/modals/Modal";
import Button from "../components/common/Button";
import jsPDF from "jspdf";

import ProductFormModal from "../components/modals/ProductFormModal";
import { api, authHeaders } from "../lib/api";
import { useDebounce } from "../hooks/useDebounce";

const initialProducts = [];
const initialCategories = [];
const DEFAULT_LOW_STOCK_LEVEL = 10;

// Helper function to get unit display string
const getUnitDisplay = (product) => {
  if (product.display_unit) {
    return product.display_unit;
  }
  if (product.product_type === 'count') {
    return 'pc';
  }
  if (product.product_type === 'weight' || product.product_type === 'volume') {
    if (product.quantity_per_unit && product.base_unit) {
      return `${product.quantity_per_unit} ${product.base_unit}`;
    }
    return product.base_unit || 'pc';
  }
  return 'pc';
};


// Helper function to format stock for PDF display (returns just the number with unit)
const formatStockForPDF = (quantityInBaseUnits, productType, quantityPerUnit, baseUnit) => {
  if (!quantityInBaseUnits || quantityInBaseUnits === 0) return '0';
  
  // For count products, show number of pieces
  if (productType === 'count' || !productType) {
    return `${Math.round(quantityInBaseUnits)}`;
  }
  
  // For volume products with base_unit "L", inventory is stored in mL
  // Convert to L for display
  if (productType === 'volume' && baseUnit === 'L') {
    const displayValue = quantityInBaseUnits / 1000; // Convert mL to L
    return displayValue % 1 === 0 ? displayValue.toFixed(0) : displayValue.toFixed(2);
  }
  
  // For weight/volume products, convert to appropriate unit for display
  let displayValue = quantityInBaseUnits;
  let displayUnit = baseUnit || 'g';
  
  // Convert to larger units for better readability
  if (baseUnit === 'g' && quantityInBaseUnits >= 1000) {
    displayValue = quantityInBaseUnits / 1000;
    displayUnit = 'kg';
  } else if (baseUnit === 'mL' && quantityInBaseUnits >= 1000) {
    displayValue = quantityInBaseUnits / 1000;
    displayUnit = 'L';
  }
  
  // Format the number (no decimals if whole number, 2 decimals otherwise)
  const formattedValue = displayValue % 1 === 0 
    ? displayValue.toFixed(0) 
    : displayValue.toFixed(2);
  
  return `${formattedValue} ${displayUnit}`;
};

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
    low_stock_level: DEFAULT_LOW_STOCK_LEVEL,
  });
  const [stockForm, setStockForm] = useState({ sku: "", quantity: "" });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [apiError, setApiError] = useState("");
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [exportingInventory, setExportingInventory] = useState(false);
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

        // Fetch inventory with pagination support
        const data = await api("/api/inventory", {
          headers: authHeaders(token),
          params: { limit: 1000, offset: 0 }, // Fetch all for now, can be optimized later
        });

        // Handle both old array format and new paginated format
        const productsData = data?.products || data || [];

        // Map backend rows to UI shape with correct column mapping
        // Include product_type and quantity_per_unit for unit conversion
        const mapped = (productsData || []).map((row) => ({
          id: String(row.id || ""),
          name: row.name || "-",
          category: row.category || "-",
          quantity: Number(row.quantity || 0), // This is quantity_in_stock (base units)
          cost_price: Number(row.cost_price || 0),
          selling_price: Number(row.selling_price || 0),
          sku: row.sku || "",
          description: row.description || "",
          low_stock_level: Number(
            row.low_stock_level ?? DEFAULT_LOW_STOCK_LEVEL
          ),
          product_type: row.product_type || "count",
          quantity_per_unit: Number(row.quantity_per_unit || 1),
          base_unit: row.base_unit || "pc",
          display_unit: row.display_unit || null,
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

  // Helper function to convert base units to display units
  const convertToDisplayUnits = (quantityInBaseUnits, productType, quantityPerUnit, baseUnit) => {
    if (!quantityInBaseUnits || quantityInBaseUnits === 0) return 0;
    if (productType === 'count' || !productType) {
      return quantityInBaseUnits;
    }
    // For volume products with base_unit "L", inventory is stored in mL
    // Convert mL to L first, then divide by quantity_per_unit (which is in L per display unit)
    // Example: 50,000 mL stored → 50 L → 50 L / 1 L per bottle = 50 bottles
    if (productType === 'volume' && baseUnit === 'L') {
      const quantityInLiters = quantityInBaseUnits / 1000; // Convert mL to L
      if (quantityPerUnit && quantityPerUnit > 0) {
        const displayQty = quantityInLiters / quantityPerUnit;
        // Safety check: if the calculated display quantity is unreasonably large (> 100,000), 
        // it's likely a data entry error - log a warning
        if (displayQty > 100000) {
          console.error(`[Inventory Conversion Error] Unusually large display quantity calculated: ${displayQty.toFixed(2)}. quantityInBaseUnits: ${quantityInBaseUnits}, quantityPerUnit: ${quantityPerUnit}, baseUnit: ${baseUnit}. This suggests incorrect data storage.`);
        }
        return displayQty;
      }
      return quantityInLiters;
    }
    if (quantityPerUnit && quantityPerUnit > 0) {
      return quantityInBaseUnits / quantityPerUnit;
    }
    return quantityInBaseUnits;
  };

  // Check for duplicate products (by ID) - this could cause calculation errors
  const productIds = products.map(p => p.id);
  const duplicateIds = productIds.filter((id, index) => productIds.indexOf(id) !== index);
  if (duplicateIds.length > 0) {
    console.warn(`⚠️ Found duplicate products in array:`, duplicateIds);
  }

  // Stats - use display units for calculations
  // Inventory value should be based on cost_price (what you paid), not selling_price (what you sell it for)
  const totalInventoryValue = products.reduce((sum, p) => {
    const displayQty = convertToDisplayUnits(p.quantity, p.product_type, p.quantity_per_unit, p.base_unit);
    const costPrice = Number(p.cost_price || 0);
    const itemValue = costPrice * displayQty;
    
    // Debug logging for volume products with base_unit "L" to catch conversion issues
    if (p.product_type === 'volume' && p.base_unit === 'L') {
      console.log(`[Inventory Value Debug] Product: ${p.name} (ID: ${p.id})`, {
        quantity_in_stock_base_units: p.quantity,
        quantity_per_unit: p.quantity_per_unit,
        base_unit: p.base_unit,
        display_qty_calculated: displayQty,
        cost_price: costPrice,
        item_value: itemValue
      });
    }
    
    // Add validation to catch unrealistic values (likely data entry errors)
    // If a single item's value exceeds 1 million, log a detailed warning
    if (itemValue > 1000000) {
      console.error(`❌ CRITICAL: Unusually high inventory value for product "${p.name}" (ID: ${p.id}): ₱${itemValue.toLocaleString()}`);
      console.error(`   Details: quantity=${p.quantity}, cost_price=${costPrice}, displayQty=${displayQty.toFixed(2)}, quantity_per_unit=${p.quantity_per_unit}, base_unit=${p.base_unit}`);
      console.error(`   This suggests incorrect data. Please check the product's quantity_in_stock in the database.`);
    }
    
    return sum + itemValue;
  }, 0);
  
  // Always log the total and breakdown for debugging (remove the condition temporarily)
  console.log(`[Inventory Total Debug] Total inventory value: ₱${totalInventoryValue.toLocaleString()}`);
  console.log(`[Inventory Total Debug] Number of products: ${products.length}`);
  
  const productBreakdown = products.map(p => {
    const dq = convertToDisplayUnits(p.quantity, p.product_type, p.quantity_per_unit, p.base_unit);
    const val = dq * (p.cost_price || 0);
    return {
      id: p.id,
      name: p.name,
      quantity: p.quantity,
      displayQty: parseFloat(dq.toFixed(2)),
      costPrice: p.cost_price,
      value: val,
      product_type: p.product_type,
      base_unit: p.base_unit,
      quantity_per_unit: p.quantity_per_unit
    };
  }).sort((a, b) => b.value - a.value); // Sort by value descending
  
  console.log(`[Inventory Total Debug] Breakdown by product (sorted by value):`, productBreakdown);
  
  const sumVerification = products.reduce((sum, p) => {
    const dq = convertToDisplayUnits(p.quantity, p.product_type, p.quantity_per_unit, p.base_unit);
    return sum + (dq * (p.cost_price || 0));
  }, 0);
  
  console.log(`[Inventory Total Debug] Sum verification: ₱${sumVerification.toLocaleString()}`);
  
  // Check if there's a discrepancy
  if (Math.abs(totalInventoryValue - sumVerification) > 0.01) {
    console.error(`❌ DISCREPANCY DETECTED: Calculated total (${totalInventoryValue}) doesn't match sum verification (${sumVerification})`);
  }
  
  // Final validation: if total is unreasonably high, log a warning
  if (totalInventoryValue > 1000000) {
    console.warn(`⚠️ WARNING: Total inventory value is unusually high: ₱${totalInventoryValue.toLocaleString()}`);
    console.warn(`   Top 3 products by value:`, productBreakdown.slice(0, 3));
  }
  
  const lowStockItems = products.filter((p) => {
    const displayQty = convertToDisplayUnits(p.quantity, p.product_type, p.quantity_per_unit, p.base_unit);
    const threshold = Number(p.low_stock_level ?? DEFAULT_LOW_STOCK_LEVEL);
    return displayQty < threshold;
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
      formatValue: (val) => {
        console.log(`[Format Value] Formatting inventory value: ${val} -> ₱${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`);
        return `₱${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
      },
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

  // Filtering, sorting and pagination - use debounced search
  const filteredProducts = useMemo(() => {
    let filtered = products.filter(
      (p) =>
        p.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        p.category.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        p.description.toLowerCase().includes(debouncedSearch.toLowerCase())
    );

    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    // Apply stock filter - use display units for comparison
    if (stockFilter) {
      if (stockFilter === "out_of_stock") {
        filtered = filtered.filter((p) => {
          const displayQty = convertToDisplayUnits(p.quantity, p.product_type, p.quantity_per_unit, p.base_unit);
          return displayQty === 0;
        });
      } else if (stockFilter === "low_stock") {
        filtered = filtered.filter((p) => {
          const displayQty = convertToDisplayUnits(p.quantity, p.product_type, p.quantity_per_unit, p.base_unit);
          const threshold = Number(
            p.low_stock_level ?? DEFAULT_LOW_STOCK_LEVEL
          );
          return displayQty > 0 && displayQty < threshold;
        });
      } else if (stockFilter === "in_stock") {
        filtered = filtered.filter((p) => {
          const displayQty = convertToDisplayUnits(p.quantity, p.product_type, p.quantity_per_unit, p.base_unit);
          const threshold = Number(
            p.low_stock_level ?? DEFAULT_LOW_STOCK_LEVEL
          );
          return displayQty >= threshold;
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
        // Sort by display units for consistent sorting across product types
        aVal = convertToDisplayUnits(a.quantity, a.product_type, a.quantity_per_unit, a.base_unit);
        bVal = convertToDisplayUnits(b.quantity, b.product_type, b.quantity_per_unit, b.base_unit);
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
  }, [products, debouncedSearch, selectedCategory, stockFilter, sortBy, sortOrder]);

  const totalPages = Math.ceil(filteredProducts.length / entriesPerPage) || 1;
  const paginatedProducts = filteredProducts.slice(
    (page - 1) * entriesPerPage,
    page * entriesPerPage
  );

  // Handlers - memoized with useCallback
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
      product_sold_by: "Per Piece",
      unit_size: "",
      unit: "",
    });
    setShowProductModal(true);
  }, []);

  const openEditProduct = useCallback((product) => {
    setEditingProduct(product);
    
    // Map product_type to product_sold_by for the form
    let productSoldBy = "Per Piece";
    if (product.product_type === 'weight') {
      productSoldBy = "By Weight";
    } else if (product.product_type === 'volume') {
      productSoldBy = "By Volume";
    }
    
    setProductForm({
      ...product,
      name: product.name || "",
      sku: product.sku || "",
      category: product.category || "",
      description: product.description || "",
      cost_price: product.cost_price || "",
      selling_price: product.selling_price || "",
      low_stock_level:
        typeof product.low_stock_level === "number"
          ? product.low_stock_level
          : DEFAULT_LOW_STOCK_LEVEL,
      product_sold_by: productSoldBy,
      unit_size: product.quantity_per_unit ? String(product.quantity_per_unit) : "",
      unit: product.base_unit && product.base_unit !== 'pc' ? product.base_unit : (product.product_type === 'weight' ? 'g' : product.product_type === 'volume' ? 'mL' : ''),
    });
    setShowProductModal(true);
  }, []);

  const openStockEntry = useCallback((product) => {
    setStockForm({ sku: product?.sku || "", quantity: "" });
    setShowStockModal(true);
  }, []);

  const handleProductFormChange = useCallback((e) => {
    const { name, value } = e.target;
    // Clear error if user explicitly clears it or starts typing in form fields
    if (name === 'clearError') {
      setApiError("");
    } else if (apiError && name !== 'clearError') {
      // Only clear error when user modifies form fields (not on initial render)
      setApiError("");
    }
    if (name !== 'clearError') {
      setProductForm((prev) => {
        const updated = { ...prev, [name]: value };
        
        // When product_sold_by changes, set default values for unit_size and unit if empty
        if (name === 'product_sold_by') {
          if (value === 'By Weight' || value === 'By Volume') {
            // Set default unit if empty
            if (!updated.unit || updated.unit === '') {
              updated.unit = value === 'By Weight' ? 'g' : 'mL';
            }
            // For editing: if unit_size is empty, try to use existing quantity_per_unit, otherwise set a default
            if (!updated.unit_size || updated.unit_size === '') {
              // If editing and product has quantity_per_unit, use it; otherwise set default
              if (editingProduct && editingProduct.quantity_per_unit) {
                updated.unit_size = String(editingProduct.quantity_per_unit);
              } else {
                // Set a default value to pass validation (user can change it)
                updated.unit_size = value === 'By Weight' ? '100' : '250';
              }
            }
          } else if (value === 'Per Piece') {
            // Clear unit fields when switching back to Per Piece
            updated.unit_size = '';
            updated.unit = '';
          }
        }
        
        return updated;
      });
    }
  }, [apiError, editingProduct]);

  const handleProductSubmit = useCallback(async (e) => {
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
            low_stock_level:
              Number(productForm.low_stock_level) || DEFAULT_LOW_STOCK_LEVEL,
            category:
              productForm.category === "Others"
                ? (productForm.customCategory || "").trim()
                : (productForm.category || "").trim(),
            description: (productForm.description || "").trim(),
            product_sold_by: productForm.product_sold_by || "Per Piece",
            unit_size: productForm.unit_size ? Number(productForm.unit_size) : undefined,
            unit: productForm.unit || undefined,
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
            low_stock_level:
              Number(productForm.low_stock_level) || DEFAULT_LOW_STOCK_LEVEL,
            product_sold_by: productForm.product_sold_by || "Per Piece",
            unit_size: productForm.unit_size ? Number(productForm.unit_size) : undefined,
            unit: productForm.unit || undefined,
          }),
        });
      }

      // Refresh inventory list after creation/update
      const data = await api("/api/inventory", { 
        headers: authHeaders(token),
        params: { limit: 1000, offset: 0 }
      });
      const productsData = data?.products || data || [];
      const mapped = (productsData || []).map((row) => ({
        id: String(row.id || ""),
        name: row.name || "-",
        category: row.category || "-",
        quantity: Number(row.quantity || 0),
        cost_price: Number(row.cost_price || 0),
        selling_price: Number(row.selling_price || 0),
        sku: row.sku || "",
        description: row.description || "",
        low_stock_level: Number(row.low_stock_level ?? DEFAULT_LOW_STOCK_LEVEL),
        product_type: row.product_type || "count",
        quantity_per_unit: Number(row.quantity_per_unit || 1),
        base_unit: row.base_unit || "pc",
        display_unit: row.display_unit || null,
      }));
      setProducts(mapped);
      setShowProductModal(false);
    } catch (err) {
      // Handle duplicate SKU error and other errors
      let errorMessage = "Failed to save product";
      try {
        // Check if error has response data (from api.js)
        const errorData = err.response?.data || err.data || {};
        const errorStatus = err.response?.status;
        
        if (errorStatus === 409 || errorData.error === 'Product with this SKU already exists') {
          // Duplicate SKU error - provide clear message
          errorMessage = errorData.message || `A product with SKU "${productForm.sku?.trim() || 'this SKU'}" already exists. Please use a different SKU.`;
          if (errorData.existingProduct) {
            errorMessage = `SKU "${productForm.sku?.trim()}" is already in use by "${errorData.existingProduct.product_name}". Please use a different SKU code.`;
          }
        } else if (errorData.error || errorData.message) {
          // Other API errors
          errorMessage = errorData.message || errorData.error;
        } else if (err.message) {
          // Error from api.js wrapper
          errorMessage = err.message;
        }
      } catch (parseErr) {
        // If parsing fails, use error message if available
        errorMessage = err.message || "Failed to save product";
        console.error("Error parsing error response:", parseErr);
      }
      setApiError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [editingProduct, productForm]);

  const handleStockSubmit = useCallback(async (e) => {
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
      const data = await api("/api/inventory", { 
        headers: authHeaders(token),
        params: { limit: 1000, offset: 0 }
      });
      const productsData = data?.products || data || [];
      const mapped = (productsData || []).map((row) => ({
        id: String(row.id || ""),
        name: row.name || "-",
        category: row.category || "-",
        quantity: Number(row.quantity || 0),
        cost_price: Number(row.cost_price || 0),
        selling_price: Number(row.selling_price || 0),
        sku: row.sku || "",
        description: row.description || "",
        low_stock_level: Number(row.low_stock_level ?? DEFAULT_LOW_STOCK_LEVEL),
        product_type: row.product_type || "count",
        quantity_per_unit: Number(row.quantity_per_unit || 1),
        base_unit: row.base_unit || "pc",
        display_unit: row.display_unit || null,
      }));
      setProducts(mapped);
      setShowStockModal(false);
    } catch (err) {
      setApiError("Failed to add stock");
    } finally {
      setLoading(false);
    }
  }, [stockForm]);

  const handleDeleteProduct = useCallback((id) => {
    const product = products.find((p) => String(p.id) === String(id));
    if (product) {
      setProductToDelete(product);
      setShowDeleteModal(true);
    }
  }, [products]);

  const confirmDeleteProduct = useCallback(async () => {
    if (!productToDelete) return;
    try {
      setLoading(true);
      setApiError("");
      const token = sessionStorage.getItem("auth_token");
      
      // First try the new API endpoint
      try {
        await api(`/api/products/${productToDelete.id}`, {
          method: "DELETE",
          headers: authHeaders(token),
        });
      } catch (err) {
        // Fallback to the old endpoint if the first one fails
        console.log('Trying fallback delete endpoint...');
        await api(`/api/inventory/${productToDelete.id}`, {
          method: "DELETE",
          headers: authHeaders(token),
        });
      }

      // Update the UI by removing the deleted product
      setProducts(prev => prev.filter(p => p.id !== productToDelete.id));
      setShowDeleteModal(false);
      setProductToDelete(null);
    } catch (err) {
      console.error('Error deleting product:', err);
      setApiError(err.response?.data?.error || "Failed to delete product. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [productToDelete]);

  const handlePageChange = useCallback((newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
  }, [totalPages]);

  const handleEntriesChange = useCallback((e) => {
    setEntriesPerPage(Number(e.target.value));
    setPage(1);
  }, []);

  const handleSearchChange = useCallback((e) => {
    setSearch(e.target.value);
    setPage(1);
  }, []);

  const handleExport = useCallback(async () => {
    setExportingInventory(true);
    try {
      const token = sessionStorage.getItem("auth_token");

      // Fetch store information
      const profileData = await api("/auth/profile", {
        headers: authHeaders(token),
      });

      const business = profileData?.business || {};
      const storeName = business.business_name || "Store";
      const addressParts = [
        business.house_number,
        business.barangay,
        business.city,
        business.province,
      ].filter(Boolean);
      const address = addressParts.join(", ") || "N/A";
      const contact = business.mobile || business.email || "N/A";

      // Check if there's any inventory data
      if (!filteredProducts || filteredProducts.length === 0) {
        alert("No inventory data found to export.");
        return;
      }

      // Calculate totals
      const totalInventoryValue = filteredProducts.reduce((sum, p) => {
        const displayQty = convertToDisplayUnits(
          p.quantity,
          p.product_type,
          p.quantity_per_unit,
          p.base_unit
        );
        const costPrice = Number(p.cost_price || 0);
        return sum + costPrice * displayQty;
      }, 0);

      // Create PDF
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      const contentWidth = pageWidth - 2 * margin;
      let yPos = margin;

      // Helper function to add a new page if needed
      const checkPageBreak = (requiredHeight) => {
        if (yPos + requiredHeight > pdf.internal.pageSize.getHeight() - margin) {
          pdf.addPage();
          yPos = margin;
          return true;
        }
        return false;
      };

      // Store name (centered, top middle)
      pdf.setFontSize(20);
      pdf.setFont("helvetica", "bold");
      const storeNameWidth = pdf.getTextWidth(storeName);
      pdf.text(storeName, (pageWidth - storeNameWidth) / 2, yPos);
      yPos += 10;

      // Address (centered, under store name)
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      const addressWidth = pdf.getTextWidth(address);
      pdf.text(address, (pageWidth - addressWidth) / 2, yPos);
      yPos += 7;

      // Contact information (centered, under address)
      const contactWidth = pdf.getTextWidth(contact);
      pdf.text(contact, (pageWidth - contactWidth) / 2, yPos);
      yPos += 15;

      // Inventory Report heading
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text("Inventory Report", margin, yPos);
      yPos += 8;

      // Export date
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      const exportDate = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      pdf.text(`Date: ${exportDate}`, margin, yPos);
      yPos += 10;

      // Table header - adjusted widths to prevent overlap
      const colWidths = [
        contentWidth * 0.24, // Product
        contentWidth * 0.14, // Category
        contentWidth * 0.16, // Cost Price
        contentWidth * 0.16, // Selling Price
        contentWidth * 0.15, // Unit
        contentWidth * 0.15, // Stock
      ];
      const colX = [margin];
      for (let i = 1; i < colWidths.length; i++) {
        colX.push(colX[i - 1] + colWidths[i - 1]);
      }

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      const headerY = yPos;
      pdf.text("Product", colX[0], headerY);
      pdf.text("Category", colX[1], headerY);
      pdf.text("Cost Price", colX[2], headerY);
      pdf.text("Selling Price", colX[3], headerY);
      pdf.text("Unit", colX[4], headerY);
      pdf.text("Stock", colX[5], headerY);
      yPos += 8;

      // Draw header line
      pdf.setLineWidth(0.5);
      pdf.line(margin, yPos - 2, pageWidth - margin, yPos - 2);
      yPos += 3;

      // Table rows
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);

      filteredProducts.forEach((item) => {
        checkPageBreak(10);

        const productName = item.name || "";
        const category = item.category || "";
        const costPrice = `PHP ${Number(item.cost_price || 0).toFixed(2)}`;
        const sellingPrice = `PHP ${Number(item.selling_price || 0).toFixed(2)}`;
        const unitDisplay = getUnitDisplay(item);
        const stockDisplay = formatStockForPDF(
          item.quantity,
          item.product_type,
          item.quantity_per_unit,
          item.base_unit
        );

        // Truncate product name if too long
        const maxNameWidth = colWidths[0] - 5;
        let displayName = productName;
        if (pdf.getTextWidth(displayName) > maxNameWidth) {
          while (
            pdf.getTextWidth(displayName + "...") > maxNameWidth &&
            displayName.length > 0
          ) {
            displayName = displayName.slice(0, -1);
          }
          displayName += "...";
        }

        // Truncate category if too long
        const maxCategoryWidth = colWidths[1] - 5;
        let displayCategory = category;
        if (pdf.getTextWidth(displayCategory) > maxCategoryWidth) {
          while (
            pdf.getTextWidth(displayCategory + "...") > maxCategoryWidth &&
            displayCategory.length > 0
          ) {
            displayCategory = displayCategory.slice(0, -1);
          }
          displayCategory += "...";
        }

        pdf.text(displayName, colX[0], yPos);
        pdf.text(displayCategory, colX[1], yPos);
        pdf.text(costPrice, colX[2], yPos);
        pdf.text(sellingPrice, colX[3], yPos);
        pdf.text(unitDisplay, colX[4], yPos);
        pdf.text(stockDisplay, colX[5], yPos);
        yPos += 7;
      });

      // Total row
      checkPageBreak(10);
      yPos += 3;
      pdf.setLineWidth(0.5);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 5;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      // Place total in the last two columns to avoid overlap
      pdf.text("Total Value:", colX[4], yPos);
      pdf.text(`PHP ${totalInventoryValue.toFixed(2)}`, colX[5], yPos);

      // Save PDF
      const timestamp = new Date().toISOString().split("T")[0];
      const fileName = `Inventory-Report-${timestamp}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error("Error exporting inventory PDF:", error);
      alert("Failed to generate inventory report. Please try again or contact support.");
    } finally {
      setExportingInventory(false);
    }
  }, [filteredProducts]);

  const headerActions = (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 sm:gap-4 mb-4 sm:mb-0 w-full">
      <div className="flex items-center justify-end gap-2 sm:gap-3 w-auto">
        {/* ADD PRODUCT Button: 'Add' on Mobile, 'Add Product' on Desktop */}
        <Button
          onClick={openAddProduct}
          variant="primary"
          microinteraction={true}
          // Same width logic as Export button
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
          {/* Full text is hidden on mobile, short text shown on mobile */}
          <span className="hidden sm:block">Add Product</span>
          <span className="sm:inline"></span>
        </Button>
        
        {/* EXPORT Button: ICON ONLY on Mobile, ICON + TEXT on Desktop */}
        <Button
          onClick={handleExport}
          variant="secondary"
          disabled={exportingInventory || loading}
          // Ensure fixed width on mobile for icon, then auto width on desktop
          className="text-sm flex items-center justify-center sm:justify-start gap-1 sm:gap-2 shrink-0 !py-2 !px-2 sm:!px-2 min-w-[40px] sm:min-w-[40px] lg:min-w-0"
        >
          {exportingInventory ? (
            <>
              <svg
                className="animate-spin w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span className="hidden sm:inline">Exporting...</span>
            </>
          ) : (
            <>
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
              {/* Text is hidden on mobile (default) and shown from 'sm' breakpoint up */}
              <span className="hidden sm:inline">Export</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <PageLayout
      title="INVENTORY"
      sidebar={<NavAdmin />}
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
      {apiError && !showProductModal && (
        <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 flex items-start gap-3 mt-4 shadow-sm">
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
              {apiError.includes("already exists") || apiError.includes("SKU") 
                ? "Duplicate Product" 
                : "Error"}
            </h3>
            <p className="text-sm text-red-700">
              {(() => {
                try {
                  const parsed = JSON.parse(apiError);
                  return parsed.error || parsed.message || apiError;
                } catch {
                  return apiError;
                }
              })()}
            </p>
            {apiError.includes("already exists") && (
              <p className="text-xs text-red-600 mt-2 italic">
                Please use a different SKU code or update the existing product instead.
              </p>
            )}
          </div>
          <button
            onClick={() => setApiError("")}
            className="flex-shrink-0 text-red-400 hover:text-red-600 transition-colors"
            aria-label="Close error"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      <Modal
        isOpen={showProductModal}
        onClose={() => {
          setShowProductModal(false);
          setApiError(""); // Clear error when closing modal
        }}
        variant="product"
        title={editingProduct ? "Edit Product" : "Add New Product"}
        editingProduct={editingProduct}
        productForm={productForm}
        onChange={handleProductFormChange}
        categories={categories}
        onSubmit={handleProductSubmit}
        loading={loading}
        error={apiError}
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
      {/* Delete Confirmation Modal */}
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
              <Button onClick={confirmDeleteProduct} variant="danger" loading={loading}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </PageLayout>
  );
}
