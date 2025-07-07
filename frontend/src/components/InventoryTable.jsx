import React from 'react';
import Button from './Button';

const EditIcon = () => (
  <svg width="18" height="18" fill="none" stroke="#2196f3" strokeWidth="2" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 1 1 2.828 2.828L11.828 15.828a4 4 0 0 1-1.414.828l-4.243 1.414 1.414-4.243a4 4 0 0 1 .828-1.414z"/></svg>
);
const DeleteIcon = () => (
  <svg width="18" height="18" fill="none" stroke="#f44336" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/><path d="M10 11v6M14 11v6"/></svg>
);
const StockIcon = () => (
  <svg width="18" height="18" fill="none" stroke="#4caf50" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2l4-4"/></svg>
);

export default function InventoryTable({
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
}) {
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
                    <button className="bg-green-100 border border-green-300 rounded-full p-1 hover:bg-green-200 transition flex items-center" title="Stock Entry">
                      <StockIcon />
                      <span className="ml-1 text-green-700 font-semibold text-xs">Stock Entry</span>
                    </button>
                    <button className="bg-blue-100 border border-blue-300 rounded-full p-1 hover:bg-blue-200 transition flex items-center" title="Update" onClick={() => onEdit(product)}>
                      <EditIcon />
                      <span className="ml-1 text-blue-700 font-semibold text-xs">Update</span>
                    </button>
                    <button className="bg-red-100 border border-red-300 rounded-full p-1 hover:bg-red-200 transition flex items-center" title="Delete" onClick={() => onDelete(product.id)}>
                      <DeleteIcon />
                      <span className="ml-1 text-red-700 font-semibold text-xs">Delete</span>
                    </button>
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
              <button
                key={i + 1}
                className={`px-3 py-1 rounded-lg font-semibold border ${page === i + 1 ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-100'}`}
                onClick={() => onPageChange(i + 1)}
                disabled={page === i + 1}
              >
                {i + 1}
              </button>
            ))}
            <Button label="Next" size="sm" variant="secondary" onClick={() => onPageChange(page + 1)} disabled={page === totalPages} />
          </div>
        </div>
      </div>
    </>
  );
} 