import React from "react";
import Button from "../common/Button";
import StatsCard from "../ui/Dashboard/StatsCard";
import Card from "../common/Card";

// Utility function to convert array of objects to CSV
const convertToCSV = (data) => {
  if (!data || data.length === 0) return "";

  const headers = [
    "Name",
    "SKU",
    "Category",
    "Description",
    "Cost Price",
    "Selling Price",
    "Stock",
  ];
  const csvRows = [];

  // Add headers
  csvRows.push(headers.join(","));

  // Add data rows
  data.forEach((item) => {
    const row = [
      `"${item.name || ""}"`,
      `"${item.sku || ""}"`,
      `"${item.category || ""}"`,
      `"${item.description || ""}"`,
      item.cost_price || 0,
      item.selling_price || 0,
      item.quantity || 0,
    ];
    csvRows.push(row.join(","));
  });

  return csvRows.join("\n");
};

// Utility function to download CSV
const downloadCSV = (csv, filename) => {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

/**
 * Inventory Table Component
 * Internal component for displaying inventory data
 */
function InventoryTable({
  products,
  allProducts,
  page,
  entriesPerPage,
  totalPages,
  onPageChange,
  onEntriesChange,
  search,
  onSearchChange,
  onEdit,
  onDelete,
  onStockEntry,
  categories = [],
  selectedCategory,
  onCategoryFilter,
  stockFilter,
  onStockFilter,
  sortBy,
  sortOrder,
  onSort,
}) {
  const EditIcon = () => (
    <svg
      className="w-4 h-4 sm:w-5 sm:h-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 1 1 2.828 2.828L11.828 15.828a4 4 0 0 1-1.414.828l-4.243 1.414 1.414-4.243a4 4 0 0 1 .828-1.414z" />
    </svg>
  );
  const DeleteIcon = () => (
    <svg
      className="w-4 h-4 sm:w-5 sm:h-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
  const StockIcon = () => (
    <svg
      className="w-4 h-4 sm:w-5 sm:h-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M12 4v16m8-8H4" />
    </svg>
  );

  const getStockStatus = (quantity) => {
    if (quantity === 0)
      return {
        label: "Out of Stock",
        color: "bg-red-100 text-red-700 border-red-200",
      };
    if (quantity < 10)
      return {
        label: "Low Stock",
        color: "bg-orange-100 text-orange-700 border-orange-200",
      };
    return {
      label: "In Stock",
      color: "bg-green-100 text-green-700 border-green-200",
    };
  };

  const SortIcon = ({ direction }) => (
    <svg
      className={`w-4 h-4 ${direction ? "text-blue-600" : "text-gray-400"}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      {direction === "asc" ? (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 15l7-7 7 7"
        />
      ) : direction === "desc" ? (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 9l-7 7-7-7"
        />
      ) : (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
        />
      )}
    </svg>
  );

  const handleSort = (field) => {
    if (sortBy === field) {
      onSort(field, sortOrder === "asc" ? "desc" : "asc");
    } else {
      onSort(field, "asc");
    }
  };

  return (
    <>
      {/* Modern Search and Controls */}
      <Card className="mb-4 sm:mb-6 p-3 sm:p-4 md:p-6 w-full overflow-hidden">
        <div className="flex flex-col gap-3 sm:gap-4 w-full">
          {/* Top Row: Search and Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4 w-full">
            {/* Search Bar */}
            <div className="flex-1 w-full min-w-0">
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                  <svg
                    className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  value={search}
                  onChange={onSearchChange}
                  className="w-full pl-9 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400"
                  placeholder="Search products, categories..."
                />
              </div>
            </div>

            {/* Controls Row */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
              {/* Sort Dropdown */}
              <div className="flex items-center gap-1 sm:gap-2">
                <label className="text-xs font-semibold text-gray-600 hidden md:block">
                  Sort:
                </label>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    // Explicitly pass event object
                    const [field, order] = e.target.value.split("-");
                    onSort(field, order);
                  }}
                  className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl px-2 sm:px-3 py-1.5 sm:py-2 text-xs font-medium text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 cursor-pointer"
                >
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                  <option value="quantity-asc">Stock (Low to High)</option>
                  <option value="quantity-desc">Stock (High to Low)</option>
                  <option value="selling_price-asc">Price (Low to High)</option>
                  <option value="selling_price-desc">
                    Price (High to Low)
                  </option>
                  <option value="category-asc">Category (A-Z)</option>
                </select>
              </div>

              {/* Entries Selector */}
              <div className="flex items-center gap-1 sm:gap-2">
                <label className="text-xs font-semibold text-gray-600 hidden md:block">
                  Show:
                </label>
                <select
                  value={entriesPerPage}
                  onChange={onEntriesChange} // Explicitly pass event object
                  className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl px-2 sm:px-3 py-1.5 sm:py-2 text-xs font-medium text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 cursor-pointer"
                >
                  {[5, 10, 25, 50, 100].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-3 border-t border-gray-100 w-full">
            <span className="text-xs font-semibold text-gray-600 shrink-0">
              Filters:
            </span>

            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <select
                value={selectedCategory || ""} // Ensure value prop is set for controlled component
                onChange={(e) => onCategoryFilter(e.target.value || null)}
                className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full px-3 sm:px-4 py-1 sm:py-1.5 text-xs font-medium text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 cursor-pointer"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id || cat.name} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Stock Status Filter */}
            <div className="flex items-center gap-2">
              <select
                value={stockFilter || ""} // Ensure value prop is set for controlled component
                onChange={(e) => onStockFilter(e.target.value || null)}
                className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full px-3 sm:px-4 py-1 sm:py-1.5 text-xs font-medium text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 cursor-pointer"
              >
                <option value="">All Stock Status</option>
                <option value="in_stock">In Stock</option>
                <option value="low_stock">Low Stock</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>

            {/* Clear Filters */}
            {(selectedCategory || stockFilter) && (
              <button
                onClick={() => {
                  onCategoryFilter(null);
                  onStockFilter(null);
                }}
                className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200 flex items-center gap-1 shrink-0"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Clear
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Table Card */}
      <Card className="overflow-hidden w-full">
        <div className="overflow-x-auto w-full relative hidden sm:block">
          {" "}
          {/* Hide table on mobile */}
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border-b-2 border-blue-100">
                <th className="py-3 px-2 sm:py-4 sm:px-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  #
                </th>
                <th
                  className="py-3 px-2 sm:py-4 sm:px-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100/50 transition-colors group"
                  onClick={() => handleSort("name")} // Added onClick handler
                >
                  <div className="flex items-center gap-1 sm:gap-2">
                    Product
                    <SortIcon
                      direction={sortBy === "name" ? sortOrder : null}
                    />
                  </div>
                </th>
                <th
                  className="py-3 px-2 sm:py-4 sm:px-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider hidden sm:table-cell cursor-pointer hover:bg-blue-100/50 transition-colors group"
                  onClick={() => handleSort("category")} // Added onClick handler
                >
                  <div className="flex items-center gap-1 sm:gap-2">
                    Category
                    <SortIcon
                      direction={sortBy === "category" ? sortOrder : null}
                    />
                  </div>
                </th>
                <th className="py-3 px-2 sm:py-4 sm:px-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider hidden md:table-cell">
                  Description
                </th>
                <th className="py-3 px-2 sm:py-4 sm:px-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider hidden lg:table-cell">
                  Cost Price
                </th>
                <th
                  className="py-3 px-2 sm:py-4 sm:px-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100/50 transition-colors group"
                  onClick={() => handleSort("selling_price")} // Added onClick handler
                >
                  <div className="flex items-center gap-1 sm:gap-2">
                    Selling Price
                    <SortIcon
                      direction={sortBy === "selling_price" ? sortOrder : null}
                    />
                  </div>
                </th>
                <th
                  className="py-3 px-2 sm:py-4 sm:px-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100/50 transition-colors group"
                  onClick={() => handleSort("quantity")} // Added onClick handler
                >
                  <div className="flex items-center gap-1 sm:gap-2">
                    Stock
                    <SortIcon
                      direction={sortBy === "quantity" ? sortOrder : null}
                    />
                  </div>
                </th>
                <th className="py-3 px-2 sm:py-4 sm:px-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <svg
                          className="w-10 h-10 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                          />
                        </svg>
                      </div>
                      <p className="text-gray-500 text-lg font-semibold">
                        No products found
                      </p>
                      <p className="text-gray-400 text-sm mt-2">
                        {search
                          ? "Try adjusting your search terms"
                          : "Start by adding your first product"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((product, idx) => {
                  const stockStatus = getStockStatus(product.quantity);
                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-blue-50/50 transition-all duration-200 group"
                    >
                      <td className="py-3 px-2 sm:py-4 sm:px-4 text-xs sm:text-sm text-gray-600 font-medium">
                        {(page - 1) * entriesPerPage + idx + 1}
                      </td>
                      <td className="py-3 px-2 sm:py-4 sm:px-4">
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs sm:text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                            {product.name || "N/A"} {/* Added N/A fallback */}
                          </span>
                          <span className="text-[10px] sm:text-xs text-gray-500 mt-0.5 truncate">
                            SKU: {product.sku || "N/A"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-2 sm:py-4 sm:px-4 hidden sm:table-cell">
                        <span className="inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {product.category}
                        </span>{" "}
                        {/* Added N/A fallback */}
                      </td>
                      <td
                        className="py-3 px-2 sm:py-4 sm:px-4 max-w-xs truncate hidden md:table-cell text-xs sm:text-sm text-gray-600"
                        title={product.description}
                      >
                        {product.description || "-"}
                      </td>
                      <td className="py-3 px-2 sm:py-4 sm:px-4 hidden lg:table-cell">
                        <span className="text-xs sm:text-sm font-medium text-gray-700">
                          ₱{Number(product.cost_price || 0).toFixed(2)}{" "}
                          {/* Added 0 fallback */}
                        </span>
                      </td>
                      <td className="py-3 px-2 sm:py-4 sm:px-4">
                        <span className="text-xs sm:text-sm font-bold text-blue-600">
                          ₱{Number(product.selling_price || 0).toFixed(2)}{" "}
                          {/* Added 0 fallback */}
                        </span>
                      </td>
                      <td className="py-3 px-2 sm:py-4 sm:px-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs sm:text-sm font-semibold text-gray-900">
                            {product.quantity}
                          </span>
                          <span
                            className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium border ${stockStatus.color}`}
                          >
                            {stockStatus.label}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-2 sm:py-4 sm:px-4">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <button
                            onClick={() =>
                              onStockEntry && onStockEntry(product)
                            }
                            className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 border border-green-200 transition-all duration-200 hover:scale-110"
                            title="Add Stock"
                          >
                            <StockIcon />
                          </button>
                          <button
                            onClick={() => onEdit(product)}
                            className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 transition-all duration-200 hover:scale-110"
                            title="Edit Product"
                          >
                            <EditIcon />
                          </button>
                          <button
                            onClick={() => onDelete(product.id)}
                            className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-all duration-200 hover:scale-110"
                            title="Delete Product"
                          >
                            <DeleteIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="sm:hidden divide-y divide-gray-100">
          {products.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg
                    className="w-10 h-10 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                </div>
                <p className="text-gray-500 text-lg font-semibold">
                  No products found
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  {search
                    ? "Try adjusting your search terms"
                    : "Start by adding your first product"}
                </p>
              </div>
            </div>
          ) : (
            products.map((product, idx) => {
              const stockStatus = getStockStatus(product.quantity);
              return (
                <div key={product.id} className="p-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">
                        {product.name || "N/A"}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        SKU: {product.sku || "N/A"}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {product.category || "N/A"}
                        </span>
                      </p>
                      {product.description && (
                        <p
                          className="text-xs text-gray-500 mt-2 italic truncate"
                          title={product.description}
                        >
                          "{product.description}"
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-sm font-bold text-blue-600">
                        ₱{Number(product.selling_price || 0).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Cost: ₱{Number(product.cost_price || 0).toFixed(2)}
                      </p>
                      <p
                        className={`text-xs font-semibold mt-1 ${
                          stockStatus.color
                            .replace("bg-", "text-")
                            .split(" ")[0]
                        }`}
                      >
                        {product.quantity} in stock
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-end gap-2 border-t border-gray-100 pt-3">
                    <button
                      onClick={() => onStockEntry && onStockEntry(product)}
                      className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 border border-green-200 transition-all duration-200"
                      title="Add Stock"
                    >
                      <StockIcon />
                    </button>
                    <button
                      onClick={() => onEdit(product)}
                      className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 transition-all duration-200"
                      title="Edit Product"
                    >
                      <EditIcon />
                    </button>
                    <button
                      onClick={() => onDelete(product.id)}
                      className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-all duration-200"
                      title="Delete Product"
                    >
                      <DeleteIcon />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Enhanced Pagination */}
        <div className="bg-gray-50/50 border-t border-gray-200 px-3 sm:px-4 md:px-6 py-3 sm:py-4 w-full">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 w-full">
            <div className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">
              Showing{" "}
              <span className="font-semibold text-gray-900">
                {products.length === 0 ? 0 : (page - 1) * entriesPerPage + 1}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-gray-900">
                {Math.min(page * entriesPerPage, products.length)}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-gray-900">
                {products.length}
              </span>{" "}
              entries
            </div>
            <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2 w-full sm:w-auto">
              <Button
                label="Previous"
                size="sm"
                variant="secondary"
                onClick={() => onPageChange(page - 1)}
                disabled={page === 1}
                className="min-w-[80px] sm:min-w-[100px] text-xs sm:text-sm"
              />
              <div className="flex items-center gap-1 flex-wrap justify-center">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={
                        page === pageNum
                          ? "paginationActive"
                          : "paginationInactive"
                      }
                      onClick={() => onPageChange(pageNum)}
                      disabled={page === pageNum}
                      className="min-w-[36px] sm:min-w-[40px] text-xs sm:text-sm"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                label="Next"
                size="sm"
                variant="secondary"
                onClick={() => onPageChange(page + 1)}
                disabled={page === totalPages}
                className="min-w-[80px] sm:min-w-[100px] text-xs sm:text-sm"
              />
            </div>
          </div>
        </div>
      </Card>
    </>
  );
}

/**
 * Inventory Stats Component
 * Internal component for displaying inventory statistics
 */
function InventoryStats({ stats }) {
  return (
    // This component is not actually used in pages/Inventory.jsx, but keeping it for completeness if it were to be used elsewhere.
    <div className="grid grid-cols-12 gap-3 sm:gap-4 md:gap-5 mb-4 sm:mb-6 md:mb-8 w-full">
      {stats.map((stat, i) => (
        <StatsCard
          key={stat.label}
          label={stat.label}
          value={stat.value}
          icon={stat.icon}
          color={stat.color}
          change={0}
          sub={stat.description || ""} // Changed 'sub' to 'description' as per previous refactor
          formatValue={stat.formatValue}
          className={`col-span-12 xs:col-span-6 sm:col-span-6 md:col-span-4 lg:col-span-3 xl:col-span-3 ${
            // More consistent grid for 4 stats
            i === 0 // This conditional class is now less relevant with a more uniform grid
              ? "sm:col-span-6 lg:col-span-6"
              : "sm:col-span-6 lg:col-span-3 xl:col-span-2"
          }`}
        />
      ))}
    </div>
  );
}

/**
 * Main Inventory Component
 * Combines stats and table into a single, cohesive component
 */
function Inventory({
  products,
  allProducts = products, // For calculating stats from all products, not just paginated
  stats,
  page,
  entriesPerPage,
  totalPages,
  onPageChange,
  onEntriesChange,
  search,
  onSearchChange,
  onEdit,
  onDelete,
  onAddProduct,
  onStockEntry,
  onExport,
  categories = [],
  selectedCategory,
  onCategoryFilter,
  stockFilter,
  onStockFilter,
  sortBy,
  sortOrder,
  onSort,
  className = "",
}) {
  const totalValue = allProducts.reduce(
    (sum, p) => sum + Number(p.selling_price || 0) * Number(p.quantity || 0),
    0
  );
  const lowStockCount = allProducts.filter(
    (p) => Number(p.quantity || 0) < 10
  ).length;

  const handleExport = () => {
    const csv = convertToCSV(allProducts);
    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `inventory_export_${timestamp}.csv`;
    downloadCSV(csv, filename);
  };

  return (
    <div
      className={`w-full max-w-full overflow-x-hidden py-4 sm:py-6 px-4 md:px-6 ${className}`}
    >
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 sm:gap-4 mb-4 sm:mb-6 w-full">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
          <Button
            onClick={handleExport}
            size="lg"
            variant="secondary"
            className="flex items-center gap-2 w-full sm:w-auto shrink-0"
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
            <span className="sm:hidden">Export</span>
          </Button>
          <Button
            onClick={onAddProduct}
            size="lg"
            variant="primary"
            microinteraction
            className="flex items-center gap-2 shadow-lg hover:shadow-xl w-full sm:w-auto shrink-0"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span className="hidden sm:inline">Add Product</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <Card className="mb-4 sm:mb-6 p-3 sm:p-4 md:p-6 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border-blue-100 w-full overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 w-full">
          {" "}
          {/* Added xl:grid-cols-4 for wider screens */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide truncate">
                Total Products
              </p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                {allProducts.length || 0} {/* Added 0 fallback */}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600"
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
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide truncate">
                Low Stock Items
              </p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                {lowStockCount || 0} {/* Added 0 fallback */}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 sm:col-span-2 lg:col-span-1">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide truncate">
                Total Inventory Value
              </p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                ₱ {/* Added 0 fallback */}
                {totalValue.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Table */}
      <InventoryTable
        products={products}
        page={page}
        entriesPerPage={entriesPerPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        onEntriesChange={onEntriesChange}
        search={search}
        onSearchChange={onSearchChange}
        onEdit={onEdit}
        onDelete={onDelete}
        onStockEntry={onStockEntry}
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryFilter={onCategoryFilter}
        stockFilter={stockFilter}
        onStockFilter={onStockFilter}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={onSort}
      />
    </div>
  );
}

export default Inventory;
