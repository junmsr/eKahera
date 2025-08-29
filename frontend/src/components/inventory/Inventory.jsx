import React from 'react';
import Button from '../common/Button';
import StatsCard from '../ui/Dashboard/StatsCard';

/**
 * Inventory Table Component
 * Internal component for displaying inventory data
 */
function InventoryTable({
  products,
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
}) {
  const EditIcon = () => (
    <svg width="18" height="18" fill="none" stroke="#2196f3" strokeWidth="2" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 1 1 2.828 2.828L11.828 15.828a4 4 0 0 1-1.414.828l-4.243 1.414 1.414-4.243a4 4 0 0 1 .828-1.414z"/></svg>
  );
  const DeleteIcon = () => (
    <svg width="18" height="18" fill="none" stroke="#f44336" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/><path d="M10 11v6M14 11v6"/></svg>
  );
  const StockIcon = () => (
    <svg width="18" height="18" fill="none" stroke="#4caf50" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2l4-4"/></svg>
  );

  return (
    <>
      {/* Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2 gap-2">
        <div className="flex flex-row gap-2 items-center">
          <label className="text-sm text-blue-800 font-semibold mr-2">Show</label>
          <select value={entriesPerPage} onChange={onEntriesChange} className="rounded-lg border border-blue-200 px-2 py-1 text-sm focus:ring-2 focus:ring-blue-400">
            {[5, 10, 25, 50].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <span className="text-sm text-blue-800 font-semibold ml-2">entries</span>
          <div className="ml-4 flex items-center">
            <label className="text-sm text-blue-800 font-semibold mr-2">Search:</label>
            <input
              type="text"
              value={search}
              onChange={onSearchChange}
              className="rounded-lg border border-blue-200 px-2 py-1 text-sm focus:ring-2 focus:ring-blue-400"
              placeholder="Search..."
            />
          </div>
        </div>
      </div>
      {/* Table */}
      <div className="bg-white rounded-2xl shadow-2xl p-4 md:p-8 mt-2">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate" style={{ borderSpacing: 0 }}>
            <thead className="sticky top-0 z-10 bg-white/90">
              <tr className="border-b border-blue-200">
                <th className="py-2 px-2 font-bold text-black">#</th>
                <th className="py-2 px-2 font-bold text-black">Name</th>
                <th className="py-2 px-2 font-bold text-black">Category</th>
                <th className="py-2 px-2 font-bold text-black">Description</th>
                <th className="py-2 px-2 font-bold text-black">Quantity</th>
                <th className="py-2 px-2 font-bold text-black">Price</th>
                <th className="py-2 px-2 font-bold text-black">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-blue-300 py-8">No products</td></tr>
              ) : products.map((product, idx) => (
                <tr key={product.id} className="border-b border-blue-100 hover:bg-blue-50/60 transition-colors">
                  <td className="py-2 px-2">{(page - 1) * entriesPerPage + idx + 1}</td>
                  <td className="py-2 px-2 font-medium text-blue-900">{product.name}</td>
                  <td className="py-2 px-2">{product.category}</td>
                  <td className="py-2 px-2 max-w-xs truncate" title={product.description}>{product.description}</td>
                  <td className="py-2 px-2">{product.quantity}</td>
                  <td className="py-2 px-2">${Number(product.price).toFixed(2)}</td>
                  <td className="py-2 px-2 flex gap-2">
                    <Button 
                      variant="stockEntry" 
                      title="Stock Entry"
                      onClick={() => onStockEntry && onStockEntry(product)}
                      icon={<StockIcon />}
                      children={<span className="ml-1 text-green-700 font-semibold text-xs">Stock Entry</span>}
                    />
                    <Button 
                      variant="edit" 
                      title="Update" 
                      onClick={() => onEdit(product)}
                      icon={<EditIcon />}
                      children={<span className="ml-1 text-blue-700 font-semibold text-xs">Update</span>}
                    />
                    <Button 
                      variant="delete" 
                      title="Delete" 
                      onClick={() => onDelete(product.id)}
                      icon={<DeleteIcon />}
                      children={<span className="ml-1 text-red-700 font-semibold text-xs">Delete</span>}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mt-4 gap-2">
          <div className="text-sm text-blue-800">
            Showing {products.length === 0 ? 0 : (page - 1) * entriesPerPage + 1} to {Math.min(page * entriesPerPage, products.length)} of {products.length} entries
          </div>
          <div className="flex gap-2 items-center">
            <Button label="Previous" size="sm" variant="secondary" onClick={() => onPageChange(page - 1)} disabled={page === 1} />
            {Array.from({ length: totalPages }, (_, i) => (
              <Button
                key={i + 1}
                variant={page === i + 1 ? "paginationActive" : "paginationInactive"}
                onClick={() => onPageChange(i + 1)}
                disabled={page === i + 1}
                children={i + 1}
              />
            ))}
            <Button label="Next" size="sm" variant="secondary" onClick={() => onPageChange(page + 1)} disabled={page === totalPages} />
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Inventory Stats Component
 * Internal component for displaying inventory statistics
 */
function InventoryStats({ stats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, i) => (
        <StatsCard
          key={stat.label}
          label={stat.label}
          value={stat.value}
          icon={stat.icon}
          color={stat.color}
          change={0}
          sub={i === 1 ? 'This Month' : ''}
          className="h-full"
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
  className = ''
}) {
  return (
    <div className={`max-w-7xl mx-auto py-8 px-2 md:px-6 ${className}`}>
      <InventoryStats stats={stats} />
      <h2 className="text-2xl font-bold text-blue-900 tracking-tight mb-2 md:mb-0">Inventory List</h2>
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
      />
      <div className="flex flex-row gap-6 mt-8 px-2">
        <Button 
          label="ADD PRODUCT" 
          onClick={onAddProduct} 
          size="lg" 
          variant="primary" 
          microinteraction 
        />
      </div>
    </div>
  );
}

export default Inventory; 