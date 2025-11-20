import React, { useState, useEffect } from "react";
import PageLayout from "../components/layout/PageLayout";
import NavAdmin from "../components/layout/Nav-Admin";
import Button from "../components/common/Button";
import CashierFormModal from "../components/modals/CashierFormModal";
import { api, authHeaders } from "../lib/api";

// (Assuming initialCashiers is defined elsewhere or is intended to be empty)
const initialCashiers = [];

export default function Cashiers() {
  const [cashiers, setCashiers] = useState(initialCashiers);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCashier, setEditingCashier] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    password: "",
    number: "",
    email: "",
    status: "ACTIVE",
  });
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // Load cashiers from API
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setApiError("");
        const token = sessionStorage.getItem("auth_token");
        const list = await api("/api/business/cashiers", {
          headers: authHeaders(token),
        });
        const mapped = (list || []).map((r) => ({
          name: r.username || "-",
          id: r.user_id || "-",
          number: r.contact_number || "-",
          email: r.email || "-",
          status: "ACTIVE",
        }));
        setCashiers(mapped);
      } catch (err) {
        setApiError(err.message || "Failed to load cashiers");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredCashiers = React.useMemo(() => {
    const q = (search || "").toLowerCase();
    return cashiers.filter((c) => {
      const matchesQuery =
        c.name.toLowerCase().includes(q) ||
        String(c.id).toLowerCase().includes(q) ||
        (c.email || "").toLowerCase().includes(q) ||
        (c.number || "").toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === "ALL" ? true : c.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [cashiers, search, statusFilter]);

  // Handle Add Cashier
  const handleAddCashier = () => {
    setForm({
      name: "",
      password: "",
      number: "",
      email: "",
      status: "ACTIVE",
    });
    setEditingCashier(null);
    setShowAddModal(true);
  };

  const handleSaveAdd = async (formData) => {
    try {
      setModalLoading(true);
      setApiError("");
      const token = sessionStorage.getItem("auth_token");
      await api("/api/business/cashiers", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders(token) },
        body: JSON.stringify({
          username: (formData.name || "").trim(),
          password: (formData.password || "").trim(),
          contact_number: (formData.number || "").trim() || null,
          email: (formData.email || "").trim() || null,
        }),
      });
      // refresh list
      const list = await api("/api/business/cashiers", {
        headers: authHeaders(token),
      });
      const mapped = (list || []).map((r) => ({
        name: r.username || "-",
        id: r.user_id || "-",
        number: r.contact_number || "-",
        email: r.email || "-",
        status: "ACTIVE",
      }));
      setCashiers(mapped);
      setShowAddModal(false);
    } catch (err) {
      setApiError(err.message || "Failed to create cashier");
    } finally {
      setModalLoading(false);
    }
  };

  // Handle Edit Cashier
  const handleEditCashier = (idx) => {
    setEditingCashier(idx);
    setForm({ ...cashiers[idx] });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (formData) => {
    try {
      setModalLoading(true);
      const updated = [...cashiers];
      updated[editingCashier] = formData;
      setCashiers(updated);
      setShowEditModal(false);
      setEditingCashier(null);
    } catch (err) {
      setApiError(err.message || "Failed to update cashier");
    } finally {
      setModalLoading(false);
    }
  };

  // Handle Delete Cashier
  const handleDeleteCashier = (idx) => {
    if (window.confirm("Are you sure you want to delete this cashier?")) {
      setCashiers(cashiers.filter((_, i) => i !== idx));
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ["Name", "Cashier ID", "Number", "Email", "Status"];
    const rows = filteredCashiers.map((c) => [
      c.name,
      c.id,
      c.number,
      c.email,
      c.status,
    ]);
    const csvContent = [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "cashiers.csv";
    link.click();
  };

  return (
    <PageLayout
      title="Cashiers"
      subtitle="Manage cashier accounts and permissions"
      sidebar={<NavAdmin />}
      isSidebarOpen={isSidebarOpen}
      setSidebarOpen={setSidebarOpen}
      className="min-h-screen bg-white"
    >
      <div className="flex-1 bg-transparent overflow-hidden p-3 sm:p-4">
        <div className="flex flex-col items-center">
          {/* Top Controls */}
          <div className="w-full max-w-5xl mb-3 flex flex-col sm:flex-row gap-2.5 sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                  <svg
                    className="w-4 h-4 text-gray-400"
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
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full sm:w-72 pl-9 pr-3 py-1.5 rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Search cashier by name, ID, email or number"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={exportToCSV}
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
                className="bg-blue-600 text-white font-semibold px-4 py-1.5 rounded-xl shadow hover:bg-blue-700 transition"
                onClick={handleAddCashier}
              >
                <div className="flex items-center gap-2">
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
                  Add Cashier
                </div>
              </Button>
            </div>
          </div>

          {apiError && (
            <div className="w-full max-w-5xl mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {apiError}
            </div>
          )}

          <div className="w-full max-w-5xl bg-white rounded-2xl shadow-lg border border-blue-100 p-0">
            {/* Desktop / wide screens: table */}
            <div className="w-full overflow-x-auto hidden [@media (orientation: landscape)]:block md:block">
              <table className="w-full min-w-0 md:min-w-[720px] text-left rounded-xl overflow-hidden">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 text-gray-700 font-semibold text-xs uppercase tracking-wider border-b border-blue-100">
                    <th className="py-2 px-3 sm:px-5">Name</th>
                    <th className="py-2 px-3 sm:px-5">Cashier ID</th>
                    <th className="py-2 px-3 sm:px-5">Number</th>
                    <th className="py-2 px-3 sm:px-5">Email</th>
                    <th className="py-2 px-3 sm:px-5">Status</th>
                    <th className="py-2 px-3 sm:px-5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading &&
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={`skeleton-${i}`} className="animate-pulse">
                        <td className="py-3 px-3 sm:px-5">
                          <div className="h-3 w-28 bg-gray-200 rounded" />
                        </td>
                        <td className="py-3 px-3 sm:px-5">
                          <div className="h-3 w-16 bg-gray-200 rounded" />
                        </td>
                        <td className="py-3 px-3 sm:px-5">
                          <div className="h-3 w-24 bg-gray-200 rounded" />
                        </td>
                        <td className="py-3 px-3 sm:px-5">
                          <div className="h-3 w-40 bg-gray-200 rounded" />
                        </td>
                        <td className="py-3 px-3 sm:px-5">
                          <div className="h-3 w-16 bg-gray-200 rounded" />
                        </td>
                        <td className="py-3 px-3 sm:px-5">
                          <div className="h-8 w-20 bg-gray-200 rounded" />
                        </td>
                      </tr>
                    ))}

                  {!loading && filteredCashiers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8">
                        <div className="flex flex-col items-center justify-center text-center">
                          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                            <svg
                              className="w-7 h-7 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 7h18M5 7V5a2 2 0 012-2h10a2 2 0 012 2v2M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7"
                              />
                            </svg>
                          </div>
                          <p className="text-gray-600 font-semibold">
                            No cashiers found
                          </p>
                          <p className="text-gray-400 text-sm">
                            Try changing filters or add a new cashier
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    filteredCashiers.map((c, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-blue-50/40 transition-colors"
                      >
                        <td className="py-2.5 px-3 sm:px-5 font-medium text-gray-900">
                          {c.name}
                        </td>
                        <td className="py-2.5 px-3 sm:px-5 text-gray-700">
                          {c.id}
                        </td>
                        <td className="py-2.5 px-3 sm:px-5 text-gray-700">
                          {c.number}
                        </td>
                        <td className="py-2.5 px-3 sm:px-5 text-gray-700">
                          {c.email}
                        </td>
                        <td className="py-2.5 px-3 sm:px-5">
                          <span
                            className={
                              c.status === "ACTIVE"
                                ? "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200"
                                : "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200"
                            }
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 sm:px-5">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="icon"
                              className="bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-full p-1.5 border border-blue-200"
                              onClick={() => handleEditCashier(idx)}
                              title="Edit"
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
                                  d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a4 4 0 01-1.414.828l-4.243 1.414 1.414-4.243a4 4 0 01.828-1.414z"
                                />
                              </svg>
                            </Button>
                            <Button
                              variant="icon"
                              className="bg-red-50 hover:bg-red-100 text-red-700 rounded-full p-1.5 border border-red-200"
                              onClick={() => handleDeleteCashier(idx)}
                              title="Delete"
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
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Mobile / narrow screens: stacked card layout */}
            <div className="w-full sm:hidden px-3 py-3 space-y-3">
              {loading &&
                Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={`card-skel-${i}`}
                    className="animate-pulse bg-white border rounded-lg p-3 shadow-sm"
                  >
                    <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
                    <div className="h-3 w-24 bg-gray-200 rounded mb-1" />
                    <div className="h-3 w-40 bg-gray-200 rounded" />
                  </div>
                ))}

              {!loading && filteredCashiers.length === 0 && (
                <div className="bg-white border rounded-lg p-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <svg
                      className="w-6 h-6 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 7h18M5 7V5a2 2 0 012-2h10a2 2 0 012 2v2M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-600 font-semibold">
                    No cashiers found
                  </p>
                  <p className="text-gray-400 text-sm">
                    Try changing filters or add a new cashier
                  </p>
                </div>
              )}

              {!loading &&
                filteredCashiers.map((c, idx) => (
                  <div
                    key={`card-${idx}`}
                    className="bg-white border rounded-lg p-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {c.name}
                        </div>
                        <div className="text-xs text-gray-500">ID: {c.id}</div>
                      </div>
                      <div className="text-right">
                        <div className="mb-1">
                          <span
                            className={
                              c.status === "ACTIVE"
                                ? "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200"
                                : "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200"
                            }
                          >
                            {c.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="icon"
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-full p-1.5 border border-blue-200"
                            onClick={() => handleEditCashier(idx)}
                            title="Edit"
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
                                d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a4 4 0 01-1.414.828l-4.243 1.414 1.414-4.243a4 4 0 01.828-1.414z"
                              />
                            </svg>
                          </Button>
                          <Button
                            variant="icon"
                            className="bg-red-50 hover:bg-red-100 text-red-700 rounded-full p-1.5 border border-red-200"
                            onClick={() => handleDeleteCashier(idx)}
                            title="Delete"
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
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 text-sm text-gray-700">
                      <div className="truncate">
                        <strong>Number:</strong> {c.number}
                      </div>
                      <div className="truncate">
                        <strong>Email:</strong> {c.email}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
          {/* Spacing */}
          <div className="h-4" />
        </div>
      </div>
      {/* Add Cashier Modal */}
      <CashierFormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleSaveAdd}
        title="Add New Cashier"
        submitButtonText="Create Cashier"
        isLoading={modalLoading}
      />

      {/* Edit Cashier Modal */}
      <CashierFormModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleSaveEdit}
        title="Edit Cashier"
        submitButtonText="Update Cashier"
        initialData={form}
        isLoading={modalLoading}
      />
    </PageLayout>
  );
}
