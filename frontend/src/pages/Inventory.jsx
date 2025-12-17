import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import PageLayout from "../components/layout/PageLayout";
import NavAdmin from "../components/layout/Nav-Admin";
import Inventory from "../components/inventory/Inventory";
import Modal from "../components/modals/Modal";
import Button from "../components/common/Button";
import jsPDF from "jspdf";
import dayjs from "dayjs";

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

/**
 * Import Success Modal Component
 */
function ImportSuccessModal({ isOpen, onClose, successCount, errors }) {
  if (!isOpen) return null;

  const hasErrors = errors && errors.length > 0;

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
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`bg-gradient-to-r ${hasErrors ? 'from-yellow-50 via-yellow-50/80 to-orange-50/50 border-b border-yellow-100' : 'from-green-50 via-green-50/80 to-emerald-50/50 border-b border-green-100'} px-6 py-5 rounded-t-2xl flex items-center justify-between`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 bg-gradient-to-br ${hasErrors ? 'from-yellow-500 to-orange-600' : 'from-green-500 to-emerald-600'} rounded-xl flex items-center justify-center shadow-lg`}>
              {hasErrors ? (
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
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              ) : (
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {hasErrors ? 'Import Completed with Warnings' : 'Import Successful'}
              </h2>
              <p className="text-sm text-gray-600">
                {hasErrors ? 'Some products were imported with errors' : 'All products imported successfully'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200 p-2 rounded-xl"
            type="button"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-6 py-6">
          <div className="space-y-4">
            {/* Success message */}
            <div className={`bg-gradient-to-r ${hasErrors ? 'from-yellow-50 to-orange-50' : 'from-green-50 to-emerald-50'} border-l-4 ${hasErrors ? 'border-yellow-500' : 'border-green-500'} rounded-lg p-4`}>
              <div className="flex items-center gap-3">
                <div className={`flex-shrink-0 w-10 h-10 ${hasErrors ? 'bg-yellow-100' : 'bg-green-100'} rounded-full flex items-center justify-center`}>
                  <span className={`text-lg font-bold ${hasErrors ? 'text-yellow-700' : 'text-green-700'}`}>
                    {successCount}
                  </span>
                </div>
                <div>
                  <p className={`text-sm font-semibold ${hasErrors ? 'text-yellow-800' : 'text-green-800'}`}>
                    {successCount} {successCount === 1 ? 'product' : 'products'} imported successfully
                  </p>
                </div>
              </div>
            </div>

            {/* Errors section */}
            {hasErrors && (
              <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-red-800 mb-2">
                  {errors.length} {errors.length === 1 ? 'error' : 'errors'} encountered:
                </h3>
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {errors.slice(0, 10).map((error, index) => (
                    <p key={index} className="text-xs text-red-700 font-mono bg-red-100 px-2 py-1 rounded">
                      {error}
                    </p>
                  ))}
                  {errors.length > 10 && (
                    <p className="text-xs text-red-600 italic mt-2">
                      ... and {errors.length - 10} more error{errors.length - 10 > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 px-6 py-4 bg-gradient-to-t from-slate-50 via-white to-transparent border-t border-slate-200/10 flex justify-end gap-3 backdrop-blur-sm">
          <Button
            onClick={onClose}
            variant="primary"
          >
            OK
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * CSV Import Modal Component
 */
function CSVImportModal({ isOpen, onClose, onImport, loading, error }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [showWarning, setShowWarning] = useState(false);
  const [csvContent, setCsvContent] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check if file is CSV
    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
      alert('Please select a CSV file');
      return;
    }

    setSelectedFile(file);
    setShowWarning(false);
    setCsvContent(null);

    // Read file content
    const reader = new FileReader();
    reader.onload = (event) => {
      setCsvContent(event.target.result);
    };
    reader.onerror = () => {
      alert('Failed to read file');
      setSelectedFile(null);
    };
    reader.readAsText(file);
  };

  const handleImportClick = () => {
    if (!selectedFile || !csvContent) {
      alert('Please select a CSV file first');
      return;
    }
    setShowWarning(true);
  };

  const handleProceed = () => {
    if (csvContent) {
      onImport(csvContent);
      setShowWarning(false);
      setSelectedFile(null);
      setCsvContent(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCancel = () => {
    setShowWarning(false);
  };

  if (!isOpen) return null;

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
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 via-blue-50/80 to-indigo-50/50 border-b border-blue-100 px-6 py-5 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
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
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Import Products from CSV</h2>
              <p className="text-sm text-gray-600">Upload a CSV file to import products</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200 p-2 rounded-xl"
            type="button"
            disabled={loading}
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-6 py-6">
          {!showWarning ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select CSV File
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="csv-file-input"
                    disabled={loading}
                  />
                  <label
                    htmlFor="csv-file-input"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <svg
                      className="w-12 h-12 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <span className="text-sm text-gray-600">
                      {selectedFile ? selectedFile.name : 'Click to browse or drag and drop'}
                    </span>
                    <span className="text-xs text-gray-500">Only CSV files are accepted</span>
                  </label>
                </div>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-800 mb-2">Required CSV Columns:</h3>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• sku</li>
                  <li>• name</li>
                  <li>• category</li>
                  <li>• description</li>
                  <li>• product sold by</li>
                  <li>• unit size</li>
                  <li>• unit</li>
                  <li>• quantity</li>
                  <li>• cost price</li>
                  <li>• selling price</li>
                  <li>• low stock alert</li>
                </ul>
              </div>

              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-red-50 via-red-50/80 to-orange-50/50 border-l-4 border-red-500 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
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
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Warning</h3>
                    <p className="text-sm text-gray-700 mb-2">
                      This action cannot be undone. Importing products will add them to your inventory.
                    </p>
                    <p className="text-sm text-gray-600">
                      Are you sure you want to proceed with importing <strong>{selectedFile?.name}</strong>?
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 px-6 py-4 bg-gradient-to-t from-slate-50 via-white to-transparent border-t border-slate-200/10 flex justify-end gap-3 backdrop-blur-sm">
          {!showWarning ? (
            <>
              <Button
                onClick={onClose}
                variant="secondary"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleImportClick}
                variant="primary"
                disabled={!selectedFile || loading}
                loading={loading}
              >
                Import
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={handleCancel}
                variant="secondary"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleProceed}
                variant="danger"
                disabled={loading}
                loading={loading}
              >
                Proceed
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
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
  const [showImportModal, setShowImportModal] = useState(false);
  const [importingProducts, setImportingProducts] = useState(false);
  const [showImportSuccessModal, setShowImportSuccessModal] = useState(false);
  const [importResults, setImportResults] = useState({ successCount: 0, errors: [] });
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

  // CSV Import handler
  const handleCSVImport = useCallback(async (csvData) => {
    try {
      setImportingProducts(true);
      setApiError("");
      const token = sessionStorage.getItem("auth_token");

      // Parse CSV data - filter out completely empty lines
      const lines = csvData.split('\n').filter(line => line.trim().length > 0);
      if (lines.length < 2) {
        throw new Error('CSV file must contain at least a header row and one data row');
      }

      // Parse header row
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const requiredColumns = ['sku', 'name', 'category', 'description', 'product sold by', 'unit size', 'unit', 'quantity', 'cost price', 'selling price', 'low stock alert'];
      
      // Check if all required columns are present
      const missingColumns = requiredColumns.filter(col => !headers.includes(col));
      if (missingColumns.length > 0) {
        throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
      }

      // Parse data rows
      const products = [];
      const errors = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        // Skip completely empty lines
        if (!line) continue;

        try {
          // Simple CSV parsing (handles quoted values)
          const values = [];
          let current = '';
          let inQuotes = false;
          
          for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              values.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          values.push(current.trim());

          if (values.length !== headers.length) {
            errors.push(`Row ${i + 1}: Column count mismatch`);
            continue;
          }

          // Check if row is empty (all values are empty or just commas)
          const hasData = values.some(val => val && val.trim().length > 0);
          if (!hasData) {
            // Skip completely empty rows
            continue;
          }

          // Map values to object
          const product = {};
          headers.forEach((header, index) => {
            product[header] = values[index] || '';
          });

          // Validate and transform product data
          const sku = product['sku']?.trim() || `SKU-${Date.now()}-${i}`;
          const name = product['name']?.trim();
          if (!name) {
            errors.push(`Row ${i + 1}: Name is required`);
            continue;
          }

          const category = product['category']?.trim() || '';
          const description = product['description']?.trim() || '';
          
          // Normalize "product sold by" value (case-insensitive, handle variations)
          let productSoldByRaw = product['product sold by']?.trim() || 'Per Piece';
          let productSoldBy = 'Per Piece'; // default
          
          // Normalize to match backend expectations
          const soldByLower = productSoldByRaw.toLowerCase();
          if (soldByLower === 'per piece' || soldByLower === 'per_piece' || soldByLower === 'count' || soldByLower === 'piece') {
            productSoldBy = 'Per Piece';
          } else if (soldByLower === 'by weight' || soldByLower === 'by_weight' || soldByLower === 'weight' || soldByLower === 'per weight') {
            productSoldBy = 'By Weight';
          } else if (soldByLower === 'by volume' || soldByLower === 'by_volume' || soldByLower === 'volume' || soldByLower === 'per volume') {
            productSoldBy = 'By Volume';
          } else {
            // Try to match with common variations
            productSoldBy = productSoldByRaw; // Pass through, backend will validate
          }
          
          // Parse unit size - handle cases where it contains both number and unit (e.g., "1 L")
          let unitSizeRaw = product['unit size']?.trim() || '';
          let unitFromColumn = product['unit']?.trim() || '';
          let unitSize = '';
          let unit = '';
          
          if (unitSizeRaw) {
            // Check if unit size contains both number and unit (e.g., "1 L", "250 mL", "500 g")
            const unitSizeMatch = unitSizeRaw.match(/^([\d.]+)\s*(kg|g|L|mL|liter|liters|litre|litres|kilogram|kilograms)$/i);
            if (unitSizeMatch) {
              // Extract number and unit from unit size field
              unitSize = unitSizeMatch[1];
              const extractedUnit = unitSizeMatch[2].toLowerCase();
              
              // Normalize unit from unit size field
              if (extractedUnit === 'kg' || extractedUnit === 'kilogram' || extractedUnit === 'kilograms') {
                unit = 'kg';
              } else if (extractedUnit === 'g' || extractedUnit === 'gram' || extractedUnit === 'grams') {
                unit = 'g';
              } else if (extractedUnit === 'l' || extractedUnit === 'liter' || extractedUnit === 'liters' || extractedUnit === 'litre' || extractedUnit === 'litres') {
                unit = 'L';
              } else if (extractedUnit === 'ml' || extractedUnit === 'milliliter' || extractedUnit === 'milliliters' || extractedUnit === 'millilitre' || extractedUnit === 'millilitres') {
                unit = 'mL';
              }
            } else {
              // Just a number, use it as-is
              unitSize = unitSizeRaw;
              // Use unit from separate unit column if provided
              if (unitFromColumn) {
                const unitLower = unitFromColumn.toLowerCase();
                if (unitLower === 'kg' || unitLower === 'kilogram' || unitLower === 'kilograms') {
                  unit = 'kg';
                } else if (unitLower === 'g' || unitLower === 'gram' || unitLower === 'grams') {
                  unit = 'g';
                } else if (unitLower === 'l' || unitLower === 'liter' || unitLower === 'liters' || unitLower === 'litre' || unitLower === 'litres') {
                  unit = 'L';
                } else if (unitLower === 'ml' || unitLower === 'milliliter' || unitLower === 'milliliters' || unitLower === 'millilitre' || unitLower === 'millilitres') {
                  unit = 'mL';
                } else {
                  unit = unitFromColumn; // Pass through
                }
              }
            }
          } else if (unitFromColumn) {
            // Unit size is empty but unit is provided
            const unitLower = unitFromColumn.toLowerCase();
            if (unitLower === 'kg' || unitLower === 'kilogram' || unitLower === 'kilograms') {
              unit = 'kg';
            } else if (unitLower === 'g' || unitLower === 'gram' || unitLower === 'grams') {
              unit = 'g';
            } else if (unitLower === 'l' || unitLower === 'liter' || unitLower === 'liters' || unitLower === 'litre' || unitLower === 'litres') {
              unit = 'L';
            } else if (unitLower === 'ml' || unitLower === 'milliliter' || unitLower === 'milliliters' || unitLower === 'millilitre' || unitLower === 'millilitres') {
              unit = 'mL';
            } else {
              unit = unitFromColumn; // Pass through
            }
          }
          
          // For "Per Piece" products, unit size and unit should be empty/undefined
          if (productSoldBy === 'Per Piece') {
            unitSize = '';
            unit = '';
          }
          
          const quantity = Number(product['quantity']?.trim() || 0);
          const costPrice = Number(product['cost price']?.trim() || 0);
          const sellingPrice = Number(product['selling price']?.trim() || 0);
          const lowStockAlert = Number(product['low stock alert']?.trim() || DEFAULT_LOW_STOCK_LEVEL);

          if (quantity <= 0) {
            errors.push(`Row ${i + 1}: Quantity must be greater than 0`);
            continue;
          }

          if (sellingPrice < costPrice) {
            errors.push(`Row ${i + 1}: Selling price must be greater than or equal to cost price`);
            continue;
          }

          products.push({
            sku,
            name,
            category,
            description,
            product_sold_by: productSoldBy,
            unit_size: unitSize ? Number(unitSize) : undefined,
            unit: unit || undefined,
            quantity,
            cost_price: costPrice,
            selling_price: sellingPrice,
            low_stock_level: lowStockAlert,
          });
        } catch (err) {
          errors.push(`Row ${i + 1}: ${err.message || 'Invalid data'}`);
        }
      }

      if (errors.length > 0 && products.length === 0) {
        throw new Error(`Import failed:\n${errors.join('\n')}`);
      }

      if (products.length === 0) {
        throw new Error('No valid products found in CSV file');
      }

      // Call bulk import endpoint
      const response = await api("/api/products/bulk-import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(token),
        },
        body: JSON.stringify({ products }),
      });

      // Refresh inventory list
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
      setShowImportModal(false);

      // Prepare success modal data
      const apiErrors = response?.errors || [];
      const allErrors = [...errors, ...(apiErrors.map(e => `Row ${e.index + 1}: ${e.error}`))];
      const successCount = response?.success?.length || products.length;
      
      setImportResults({
        successCount,
        errors: allErrors
      });
      setShowImportSuccessModal(true);
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || "Failed to import products";
      setApiError(errorMessage);
      console.error("CSV import error:", err);
    } finally {
      setImportingProducts(false);
    }
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
      const businessName = business.business_name || "Store";
      const branchName = business.branch_name || null; // Store/Branch name if applicable
      const addressParts = [
        business.house_number,
        business.barangay,
        business.city,
        business.province,
      ].filter(Boolean);
      const address = addressParts.join(", ") || "N/A";

      // Check if there's any inventory data
      if (!filteredProducts || filteredProducts.length === 0) {
        alert("No inventory data found to export.");
        return;
      }

      // Helper function to determine stock status
      const getStockStatus = (quantity, reorderLevel) => {
        if (quantity === 0) return "Out of Stock";
        if (quantity > 0 && quantity <= reorderLevel) return "Low Stock";
        return "In Stock";
      };

      // Calculate summary statistics
      const totalProducts = filteredProducts.length;
      let totalQuantityInStock = 0; // Sum of display units (pieces/units)
      let lowStockCount = 0;
      let outOfStockCount = 0;
      const lowStockItems = [];
      const outOfStockItems = [];
      let totalInventoryValue = 0;

      filteredProducts.forEach((p) => {
        const displayQty = convertToDisplayUnits(
          p.quantity,
          p.product_type,
          p.quantity_per_unit,
          p.base_unit
        );
        const quantityInBaseUnits = Number(p.quantity || 0);
        const reorderLevel = Number(p.low_stock_level || DEFAULT_LOW_STOCK_LEVEL);
        const costPrice = Number(p.cost_price || 0);
        
        // For total quantity, sum display units (pieces/units) not base units
        totalQuantityInStock += displayQty;
        
        // Calculate stock value (using display units for valuation)
        const stockValue = costPrice * displayQty;
        totalInventoryValue += stockValue;

        // Count stock status
        const status = getStockStatus(quantityInBaseUnits, reorderLevel);
        if (status === "Low Stock") {
          lowStockCount++;
          lowStockItems.push({ ...p, displayQty, status });
        } else if (status === "Out of Stock") {
          outOfStockCount++;
          outOfStockItems.push({ ...p, displayQty, status });
        }
      });

      // Create PDF
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - 2 * margin;
      let yPos = margin;
      let pageNumber = 1;
      const totalPages = []; // Will be updated after all pages are created

      // Helper function to add a new page if needed
      const checkPageBreak = (requiredHeight) => {
        if (yPos + requiredHeight > pageHeight - margin) {
          pdf.addPage();
          pageNumber++;
          yPos = margin;
          return true;
        }
        return false;
      };

      // Helper function to add section title
      const addSectionTitle = (title, fontSize = 12) => {
        checkPageBreak(15);
        pdf.setFontSize(fontSize);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(0, 0, 0);
        pdf.text(title, margin, yPos);
        yPos += 8;
      };

      // Helper function to format currency
      const formatCurrency = (amount) => {
        return `PHP ${Number(amount || 0).toFixed(2)}`;
      };

      // Helper function to format date
      const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        try {
          return dayjs(dateString).format("MMM D, YYYY");
        } catch {
          return "N/A";
        }
      };

      // Helper function to truncate text if too long
      const truncateText = (text, maxWidth) => {
        let truncated = String(text || "");
        if (pdf.getTextWidth(truncated) > maxWidth - 2) {
          while (pdf.getTextWidth(truncated + "...") > maxWidth - 2 && truncated.length > 0) {
            truncated = truncated.slice(0, -1);
          }
          truncated += "...";
        }
        return truncated;
      };

      // Helper function to add footer to all pages
      const addFooter = () => {
        const totalPagesCount = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= totalPagesCount; i++) {
          pdf.setPage(i);
          pdf.setFontSize(8);
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(100, 100, 100);
          const footerText = `Page ${i} of ${totalPagesCount} | Generated by eKahera POS System | System-generated report`;
          const footerWidth = pdf.getTextWidth(footerText);
          pdf.text(footerText, (pageWidth - footerWidth) / 2, pageHeight - 10);
        }
      };

      // ============================================
      // 1. REPORT HEADER
      // ============================================
      pdf.setFontSize(20);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(0, 0, 0);
      const businessNameWidth = pdf.getTextWidth(businessName);
      pdf.text(businessName, (pageWidth - businessNameWidth) / 2, yPos);
      yPos += 8;

      // Store/Branch name (if applicable)
      if (branchName) {
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "normal");
        const branchNameWidth = pdf.getTextWidth(branchName);
        pdf.text(branchName, (pageWidth - branchNameWidth) / 2, yPos);
        yPos += 7;
      }

      // Report type
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      const reportTypeText = "Inventory Summary";
      const reportTypeWidth = pdf.getTextWidth(reportTypeText);
      pdf.text(reportTypeText, (pageWidth - reportTypeWidth) / 2, yPos);
      yPos += 6;

      // Date & time generated
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      const dateTimeText = `Generated: ${dayjs().format("MMM D, YYYY h:mm A")}`;
      const dateTimeWidth = pdf.getTextWidth(dateTimeText);
      pdf.text(dateTimeText, (pageWidth - dateTimeWidth) / 2, yPos);
      yPos += 5;

      // System name
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      const systemText = "System: eKahera POS";
      const systemWidth = pdf.getTextWidth(systemText);
      pdf.text(systemText, (pageWidth - systemWidth) / 2, yPos);
      yPos += 10;

      // Draw separator line
      pdf.setLineWidth(0.5);
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 8;

      // ============================================
      // 2. INVENTORY SUMMARY (TOP SECTION)
      // ============================================
      addSectionTitle("INVENTORY SUMMARY", 14);

      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(0, 0, 0);

      const summaryData = [
        ["Total Number of Products", String(totalProducts)],
        ["Total Quantity in Stock (Units)", String(Math.round(totalQuantityInStock))],
        ["Low-Stock Items", String(lowStockCount)],
        ["Out-of-Stock Items", String(outOfStockCount)],
      ];

      const summaryCol1 = margin;
      const summaryCol2 = pageWidth - margin - 60;

      summaryData.forEach(([label, value]) => {
        checkPageBreak(8);
        pdf.setFont("helvetica", "normal");
        pdf.text(label + ":", summaryCol1, yPos);
        pdf.setFont("helvetica", "bold");
        pdf.text(value, summaryCol2, yPos);
        yPos += 7;
      });

      yPos += 5;

      // ============================================
      // 3. INVENTORY STATUS TABLE (MAIN TABLE)
      // ============================================
      addSectionTitle("INVENTORY STATUS", 14);

      // Table header - adjusted column widths (added Unit column)
      const colWidths = [
        contentWidth * 0.20, // Product name
        contentWidth * 0.11, // SKU/Barcode
        contentWidth * 0.13, // Category
        contentWidth * 0.12, // Unit
        contentWidth * 0.12, // Quantity
        contentWidth * 0.12, // Reorder level
        contentWidth * 0.20, // Stock status
      ];
      const colX = [margin];
      for (let i = 1; i < colWidths.length; i++) {
        colX.push(colX[i - 1] + colWidths[i - 1]);
      }

      pdf.setFontSize(8);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(0, 0, 0);
      const headerY = yPos;
      pdf.text("Product Name", colX[0], headerY);
      pdf.text("SKU", colX[1], headerY);
      pdf.text("Category", colX[2], headerY);
      pdf.text("Unit", colX[3], headerY);
      pdf.text("Quantity", colX[4], headerY);
      pdf.text("Reorder Level", colX[5], headerY);
      pdf.text("Status", colX[6], headerY);
      yPos += 8;

      // Draw header line
      pdf.setLineWidth(0.5);
      pdf.setDrawColor(0, 0, 0);
      pdf.line(margin, yPos - 2, pageWidth - margin, yPos - 2);
      yPos += 4;

      // Table rows
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);

      filteredProducts.forEach((item) => {
        checkPageBreak(10);

        const quantityInBaseUnits = Number(item.quantity || 0);
        const reorderLevel = Number(item.low_stock_level || DEFAULT_LOW_STOCK_LEVEL);
        const status = getStockStatus(quantityInBaseUnits, reorderLevel);
        
        // Highlight low-stock and out-of-stock items
        if (status === "Out of Stock") {
          pdf.setTextColor(200, 0, 0); // Red
        } else if (status === "Low Stock") {
          pdf.setTextColor(255, 140, 0); // Orange
        } else {
          pdf.setTextColor(0, 0, 0); // Black
        }

        const productName = item.name || "";
        const sku = item.sku || "N/A";
        const category = item.category || "Uncategorized";
        const unitDisplay = getUnitDisplay(item);
        const quantityDisplay = formatStockForPDF(
          item.quantity,
          item.product_type,
          item.quantity_per_unit,
          item.base_unit
        );
        const reorderLevelDisplay = String(reorderLevel);

        pdf.text(truncateText(productName, colWidths[0]), colX[0], yPos);
        pdf.text(truncateText(sku, colWidths[1]), colX[1], yPos);
        pdf.text(truncateText(category, colWidths[2]), colX[2], yPos);
        pdf.text(truncateText(unitDisplay, colWidths[3]), colX[3], yPos);
        pdf.text(truncateText(quantityDisplay, colWidths[4]), colX[4], yPos);
        pdf.text(truncateText(reorderLevelDisplay, colWidths[5]), colX[5], yPos);
        pdf.text(truncateText(status, colWidths[6]), colX[6], yPos);
        
        pdf.setTextColor(0, 0, 0); // Reset to black
        yPos += 7;
      });

      yPos += 5;

      // ============================================
      // 4. LOW-STOCK & OUT-OF-STOCK ITEMS
      // ============================================
      if (lowStockItems.length > 0 || outOfStockItems.length > 0) {
        checkPageBreak(20);
        addSectionTitle("LOW-STOCK & OUT-OF-STOCK ITEMS", 14);

        // Out of Stock Items
        if (outOfStockItems.length > 0) {
          pdf.setFontSize(10);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(200, 0, 0);
          pdf.text("OUT OF STOCK ITEMS", margin, yPos);
          yPos += 7;

          pdf.setFontSize(8);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(0, 0, 0);
          pdf.text("Product Name", margin + 5, yPos);
          pdf.text("Current Quantity", margin + 80, yPos);
          pdf.text("Reorder Level", margin + 130, yPos);
          yPos += 5;

          pdf.setLineWidth(0.3);
          pdf.line(margin, yPos - 2, pageWidth - margin, yPos - 2);
          yPos += 4;

          pdf.setFont("helvetica", "normal");
          outOfStockItems.forEach((item) => {
            checkPageBreak(8);
            pdf.setTextColor(200, 0, 0);
            pdf.text(truncateText(item.name || "", 70), margin + 5, yPos);
            pdf.text(String(Math.round(item.displayQty || 0)), margin + 80, yPos);
            pdf.text(String(item.low_stock_level || DEFAULT_LOW_STOCK_LEVEL), margin + 130, yPos);
            yPos += 6;
          });
          yPos += 3;
        }

        // Low Stock Items
        if (lowStockItems.length > 0) {
          pdf.setFontSize(10);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(255, 140, 0);
          pdf.text("LOW STOCK ITEMS", margin, yPos);
          yPos += 7;

          pdf.setFontSize(8);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(0, 0, 0);
          pdf.text("Product Name", margin + 5, yPos);
          pdf.text("Current Quantity", margin + 80, yPos);
          pdf.text("Reorder Level", margin + 130, yPos);
          yPos += 5;

          pdf.setLineWidth(0.3);
          pdf.line(margin, yPos - 2, pageWidth - margin, yPos - 2);
          yPos += 4;

          pdf.setFont("helvetica", "normal");
          lowStockItems.forEach((item) => {
            checkPageBreak(8);
            pdf.setTextColor(255, 140, 0);
            pdf.text(truncateText(item.name || "", 70), margin + 5, yPos);
            pdf.text(String(Math.round(item.displayQty || 0)), margin + 80, yPos);
            pdf.text(String(item.low_stock_level || DEFAULT_LOW_STOCK_LEVEL), margin + 130, yPos);
            yPos += 6;
          });
          yPos += 5;
        }

        pdf.setTextColor(0, 0, 0); // Reset to black
      }

      // ============================================
      // 5. INVENTORY VALUATION
      // ============================================
      checkPageBreak(30);
      addSectionTitle("INVENTORY VALUATION", 14);

      // Valuation table header
      const valColWidths = [
        contentWidth * 0.35, // Product name
        contentWidth * 0.20, // Cost price
        contentWidth * 0.20, // Quantity
        contentWidth * 0.25, // Stock value
      ];
      const valColX = [margin];
      for (let i = 1; i < valColWidths.length; i++) {
        valColX.push(valColX[i - 1] + valColWidths[i - 1]);
      }

      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      const valHeaderY = yPos;
      pdf.text("Product Name", valColX[0], valHeaderY);
      pdf.text("Cost Price", valColX[1], valHeaderY);
      pdf.text("Quantity", valColX[2], valHeaderY);
      pdf.text("Stock Value", valColX[3], valHeaderY);
      yPos += 8;

      pdf.setLineWidth(0.5);
      pdf.line(margin, yPos - 2, pageWidth - margin, yPos - 2);
      yPos += 4;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);

      filteredProducts.forEach((item) => {
        checkPageBreak(8);
        const displayQty = convertToDisplayUnits(
          item.quantity,
          item.product_type,
          item.quantity_per_unit,
          item.base_unit
        );
        const costPrice = Number(item.cost_price || 0);
        const stockValue = costPrice * displayQty;

        pdf.text(truncateText(item.name || "", valColWidths[0]), valColX[0], yPos);
        pdf.text(formatCurrency(costPrice), valColX[1], yPos);
        pdf.text(String(Math.round(displayQty)), valColX[2], yPos);
        pdf.text(formatCurrency(stockValue), valColX[3], yPos);
        yPos += 6;
      });

      // Total inventory value
      checkPageBreak(10);
      yPos += 3;
      pdf.setLineWidth(0.5);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 5;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.text("Total Inventory Value:", margin, yPos);
      pdf.text(formatCurrency(totalInventoryValue), pageWidth - margin - 60, yPos);
      yPos += 8;

      // ============================================
      // 6. FOOTER
      // ============================================
      // Footer is added to all pages at the end
      addFooter();

      // Save PDF
      const timestamp = dayjs().format("YYYY-MM-DD");
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
        
        {/* IMPORT Button: ICON ONLY on Mobile, ICON + TEXT on Desktop */}
        <Button
          onClick={() => setShowImportModal(true)}
          variant="secondary"
          disabled={importingProducts || loading}
          className="text-sm flex items-center justify-center sm:justify-start gap-1 sm:gap-2 shrink-0 !py-2 !px-2 sm:!px-2 min-w-[40px] sm:min-w-[40px] lg:min-w-0"
        >
          {importingProducts ? (
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
              <span className="hidden sm:inline">Importing...</span>
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
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <span className="hidden sm:inline">Import</span>
            </>
          )}
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
      {/* CSV Import Modal */}
      <CSVImportModal
        isOpen={showImportModal}
        onClose={() => {
          setShowImportModal(false);
          setApiError("");
        }}
        onImport={handleCSVImport}
        loading={importingProducts}
        error={apiError}
      />
      {/* Import Success Modal */}
      <ImportSuccessModal
        isOpen={showImportSuccessModal}
        onClose={() => setShowImportSuccessModal(false)}
        successCount={importResults.successCount}
        errors={importResults.errors}
      />
    </PageLayout>
  );
}
