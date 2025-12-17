import React, { useEffect, useMemo, useState, useRef } from "react";
import { useDebounce } from "../hooks/useDebounce";
import DemoNav from "../components/layout/DemoNav";
import { BiRefresh } from "react-icons/bi";
import PageLayout from "../components/layout/PageLayout";
import Button from "../components/common/Button";
import CashierFormModal from "../components/modals/CashierFormModal";
import Modal from "../components/modals/Modal";

const MOCK_CASHIERS = [
  {
    id: 101,
    name: "John Doe",
    username: "cashier1",
    email: "john@demo.com",
    number: "09123456789",
    status: "ACTIVE",
  },
  {
    id: 102,
    name: "Jane Smith",
    username: "cashier2",
    email: "jane@demo.com",
    number: "09987654321",
    status: "INACTIVE",
  },
];

const DemoCashiers = () => {
  const [cashiers, setCashiers] = useState(MOCK_CASHIERS);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 400);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCashier, setEditingCashier] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [cashierToDelete, setCashierToDelete] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filteredCashiers = useMemo(() => {
    let filtered = cashiers;

    if (statusFilter !== "all") {
      filtered = filtered.filter((c) => {
        if (statusFilter === "active") {
          return c.status === "ACTIVE";
        } else if (statusFilter === "inactive") {
          return c.status === "INACTIVE";
        }
        return true;
      });
    }

    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          (c.name || "").toLowerCase().includes(query) ||
          (String(c.id) || "").toLowerCase().includes(query) ||
          (c.email || "").toLowerCase().includes(query) ||
          (c.number || "").toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [cashiers, statusFilter, debouncedSearchQuery]);

  // Handle Add Cashier
  const handleAddCashier = () => {
    setEditingCashier(null);
    setShowAddModal(true);
  };

  const handleSaveAdd = async (formData) => {
    try {
      setModalLoading(true);
      setError("");

      // Demo: Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      const newId = Math.max(...cashiers.map((c) => c.id)) + 1;
      const newCashier = {
        id: newId,
        name: formData.name || `Demo Cashier ${newId}`,
        username: formData.name || `user${newId}`,
        email: formData.email || `user${newId}@demo.com`,
        number: formData.number || "09000000000",
        status: formData.status || "ACTIVE",
      };

      setCashiers([...cashiers, newCashier]);
      setShowAddModal(false);
      alert("Demo cashier added!");
    } catch (err) {
      setError(err.message || "Failed to create cashier");
    } finally {
      setModalLoading(false);
    }
  };

  // Handle Edit Cashier
  const handleEditCashier = (cashier) => {
    const cashierToEdit = cashiers.find((c) => c.id === cashier.id);
    if (cashierToEdit) {
      setEditingCashier({
        ...cashierToEdit,
        name: cashierToEdit.username || cashierToEdit.name,
      });
    }
    setShowEditModal(true);
  };

  const handleSaveEdit = async (formData) => {
    try {
      setModalLoading(true);

      // Demo: Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      const updated = [...cashiers];
      const index = updated.findIndex((c) => c.id === editingCashier.id);
      if (index !== -1) {
        updated[index] = { ...updated[index], ...formData };
      }
      setCashiers(updated);
      setShowEditModal(false);
      setEditingCashier(null);
      alert("Demo cashier updated!");
    } catch (err) {
      setError(err.message || "Failed to update cashier");
    } finally {
      setModalLoading(false);
    }
  };

  // Handle Delete Cashier
  const handleDeleteCashier = (cashier) => {
    setCashierToDelete(cashier);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!cashierToDelete) return;
    try {
      setModalLoading(true);

      // Demo: Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      setCashiers(cashiers.filter((c) => c.id !== cashierToDelete.id));
      setShowDeleteModal(false);
      setError("");
      alert("Demo cashier deleted!");
    } catch (err) {
      console.error("Error deleting cashier:", err);
      setError(err.message || "Failed to delete cashier. Please try again.");
    } finally {
      setModalLoading(false);
    }
  };

  const exportToCSV = () => {
    try {
      const cashiersToExport = filteredCashiers;

      if (cashiersToExport.length === 0) {
        setError("No cashiers to export for the selected filters");
        return;
      }

      const headers = ["Name", "Cashier ID", "Number", "Email", "Status"];

      const csvRows = [
        headers.join(","),
        ...cashiersToExport.map((cashier) => {
          const row = [
            `"${(cashier.name || "").replace(/"/g, '""')}"`,
            cashier.id || "",
            `"${(cashier.number || "").replace(/"/g, '""')}"`,
            `"${(cashier.email || "").replace(/"/g, '""')}"`,
            cashier.status || "",
          ];
          return row.join(",");
        }),
      ];

      const csvContent = csvRows.join("\n");

      const filename = `demo-cashiers_export_${
        new Date().toISOString().split("T")[0]
      }.csv`;

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError("Failed to export cashiers as CSV");
      console.error("CSV export error:", err);
    }
  };

  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  const selectedStatus = statusOptions.find(
    (option) => option.value === statusFilter
  );

  const headerActions = (
    <div className="flex items-center gap-3">
      <button
        onClick={() => setLoading(true)}
        disabled={loading}
        title="Refresh Cashiers"
        className="bg-white/80 backdrop-blur-sm hover:bg-white text-gray-700 p-2 rounded-lg border border-gray-200/80 text-sm font-medium transition-all duration-200 hover:shadow-md"
      >
        <BiRefresh className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
      </button>
    </div>
  );

  return (
    <PageLayout
      title="CASHIERS (DEMO)"
      sidebar={<DemoNav />}
      isSidebarOpen={isSidebarOpen}
      setSidebarOpen={setSidebarOpen}
      className="overflow-hidden"
      headerActions={headerActions}
    >
      <div className="h-[calc(100vh-80px)] bg-transparent p-4 flex flex-col overflow-hidden">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
          <div className="relative flex-1 max-w-xl w-full flex-shrink-0">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
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
              placeholder="Search cashiers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm text-gray-900 placeholder-gray-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg hover:bg-white transition-colors text-gray-700"
              >
                <span>{selectedStatus?.label || "All Status"}</span>

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
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {isDropdownOpen && (
                <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setStatusFilter(option.value);

                        setIsDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Button
              onClick={handleAddCashier}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
            >
              Add Cashier
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-white/50 backdrop-blur-sm rounded-lg border border-gray-200/80">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Cashiers List
              </h2>

              <Button
                onClick={exportToCSV}
                variant="outline"
                className="text-gray-700 border-gray-300 hover:bg-gray-50"
              >
                Export CSV
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Name
                    </th>

                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Username
                    </th>

                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Email
                    </th>

                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Number
                    </th>

                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Status
                    </th>

                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredCashiers.map((cashier) => (
                    <tr
                      key={cashier.id}
                      className="border-b border-gray-100 hover:bg-gray-50/50"
                    >
                      <td className="py-3 px-4 text-gray-900">
                        {cashier.name}
                      </td>

                      <td className="py-3 px-4 text-gray-900">
                        {cashier.username}
                      </td>

                      <td className="py-3 px-4 text-gray-900">
                        {cashier.email}
                      </td>

                      <td className="py-3 px-4 text-gray-900">
                        {cashier.number}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            cashier.status === "ACTIVE"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {cashier.status}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditCashier(cashier)}
                            className="text-blue-600 hover:text-blue-800 p-1"
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
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>

                          <button
                            onClick={() => handleDeleteCashier(cashier)}
                            className="text-red-600 hover:text-red-800 p-1"
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
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {showAddModal && (
        <CashierFormModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={handleSaveAdd}
          loading={modalLoading}
          title="Add Cashier"
        />
      )}

      {showEditModal && editingCashier && (
        <CashierFormModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveEdit}
          loading={modalLoading}
          title="Edit Cashier"
          initialData={editingCashier}
        />
      )}

      {showDeleteModal && cashierToDelete && (
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Delete Cashier"
        >
          <div className="p-6">
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete cashier "{cashierToDelete.name}"?
              This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3">
              <Button
                onClick={() => setShowDeleteModal(false)}
                variant="outline"
                className="px-4 py-2"
              >
                Cancel
              </Button>

              <Button
                onClick={confirmDelete}
                disabled={modalLoading}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2"
              >
                {modalLoading ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </PageLayout>
  );
};

export default DemoCashiers;
