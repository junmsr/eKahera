import React, { useEffect, useState } from "react";
import NavAdmin from "../components/layout/Nav-Admin";
import PageLayout from "../components/layout/PageLayout";
import Modal from "../components/modals/Modal";
import Button from "../components/common/Button";
import { api, authHeaders } from "../lib/api";

const initialCashiers = [];

function Cashiers() {
  const [cashiers, setCashiers] = useState(initialCashiers);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [form, setForm] = useState({
    name: "",
    id: "",
    number: "",
    email: "",
    status: "ACTIVE",
  });

  // Load cashiers from API
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setApiError("");
        const token = localStorage.getItem('auth_token');
        const list = await api('/api/business/cashiers', { headers: authHeaders(token) });
        const mapped = (list || []).map(r => ({
          name: r.username || '-',
          id: r.id || '-',
          number: r.contact_number || '-',
          email: r.email || '-',
          status: 'ACTIVE',
        }));
        setCashiers(mapped);
      } catch (err) {
        setApiError(err.message || 'Failed to load cashiers');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Handle Add Cashier
  const handleAddCashier = () => {
    setForm({ name: "", id: "", number: "", email: "", status: "ACTIVE" });
    setShowAddModal(true);
  };

  const handleSaveAdd = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setApiError("");
      const token = localStorage.getItem('auth_token');
      await api('/api/business/cashiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
        body: JSON.stringify({
          username: (form.name || '').trim(),
          cashier_id: (form.id || '').trim(),
          contact_number: (form.number || '').trim() || null,
          email: (form.email || '').trim() || null,
        })
      });
      // refresh list
      const list = await api('/api/business/cashiers', { headers: authHeaders(token) });
      const mapped = (list || []).map(r => ({
        name: r.username || '-',
        id: r.id || '-',
        number: r.contact_number || '-',
        email: r.email || '-',
        status: 'ACTIVE',
      }));
      setCashiers(mapped);
      setShowAddModal(false);
    } catch (err) {
      setApiError(err.message || 'Failed to create cashier');
    } finally {
      setLoading(false);
    }
  };

  // Handle Edit Cashier
  const handleEditCashier = (idx) => {
    setEditIndex(idx);
    setForm({ ...cashiers[idx] });
    setShowEditModal(true);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    const updated = [...cashiers];
    updated[editIndex] = form;
    setCashiers(updated);
    setShowEditModal(false);
    setEditIndex(null);
  };

  // Handle Delete Cashier
  const handleDeleteCashier = (idx) => {
    if (window.confirm("Are you sure you want to delete this cashier?")) {
      setCashiers(cashiers.filter((_, i) => i !== idx));
    }
  };

  return (
    <PageLayout
      title="CASHIER"
      subtitle="Manage cashier accounts and permissions"
      sidebar={<NavAdmin />}
      className="h-screen bg-white"
    >
      <div className="flex-1 bg-transparent overflow-hidden p-8">
        <div className="flex flex-col items-center">
          <div className="w-full max-w-5xl bg-white rounded-2xl shadow-lg border border-blue-400 p-0">
            <table className="w-full text-left rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-white text-gray-700 font-semibold text-base border-b border-blue-200">
                  <th className="py-4 px-6">Name</th>
                  <th className="py-4 px-6">Cashier ID</th>
                  <th className="py-4 px-6">Number</th>
                  <th className="py-4 px-6">Email</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Action</th>
                </tr>
              </thead>
              <tbody>
                {cashiers.map((c, idx) => (
                  <tr key={idx} className={idx % 2 === 1 ? "bg-gray-100" : ""}>
                    <td className="py-4 px-6">{c.name}</td>
                    <td className="py-4 px-6">{c.id}</td>
                    <td className="py-4 px-6">{c.number}</td>
                    <td className="py-4 px-6">{c.email}</td>
                    <td className="py-4 px-6 font-bold">
                      <span className={c.status === "ACTIVE" ? "text-green-600" : "text-red-600"}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 flex gap-2">
                      <Button
                        variant="icon"
                        className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 shadow transition"
                        onClick={() => handleEditCashier(idx)}
                        title="Edit"
                      >
                        <span className="material-icons text-base">edit</span>
                      </Button>
                      <Button
                        variant="icon"
                        className="bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow transition"
                        onClick={() => handleDeleteCashier(idx)}
                        title="Delete"
                      >
                        <span className="material-icons text-base">close</span>
                      </Button>
                    </td>
                  </tr>
                ))}
                {/* Empty row for spacing */}
                <tr>
                  <td colSpan={6} className="py-8 bg-gray-100"></td>
                </tr>
              </tbody>
            </table>
          </div>
          {/* Add Cashier Button */}
          <Button
            className="mt-8 bg-white text-blue-700 font-bold px-6 py-3 rounded-2xl shadow-lg border border-gray-200 hover:bg-blue-50 transition text-lg"
            onClick={handleAddCashier}
          >
            ADD CASHIER
          </Button>
        </div>
      </div>
      {/* Add Cashier Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Cashier"
        size="sm"
        variant="glass"
      >
        <form className="flex flex-col gap-4" onSubmit={handleSaveAdd}>
          <input
            type="text"
            className="border rounded px-3 py-2"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            type="text"
            className="border rounded px-3 py-2"
            placeholder="Cashier ID"
            value={form.id}
            onChange={(e) => setForm({ ...form, id: e.target.value })}
            required
          />
          <input
            type="text"
            className="border rounded px-3 py-2"
            placeholder="Number"
            value={form.number}
            onChange={(e) => setForm({ ...form, number: e.target.value })}
            required
          />
          <input
            type="email"
            className="border rounded px-3 py-2"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <select
            className="border rounded px-3 py-2"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
          <Button
            type="submit"
            variant="primary"
            className="bg-blue-600 text-white font-bold py-2 rounded shadow hover:bg-blue-700 transition"
          >
            Save
          </Button>
        </form>
      </Modal>
      {/* Edit Cashier Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Cashier"
        size="sm"
        variant="glass"
      >
        <form className="flex flex-col gap-4" onSubmit={handleSaveEdit}>
          <input
            type="text"
            className="border rounded px-3 py-2"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            type="text"
            className="border rounded px-3 py-2"
            placeholder="Cashier ID"
            value={form.id}
            onChange={(e) => setForm({ ...form, id: e.target.value })}
            required
          />
          <input
            type="text"
            className="border rounded px-3 py-2"
            placeholder="Number"
            value={form.number}
            onChange={(e) => setForm({ ...form, number: e.target.value })}
            required
          />
          <input
            type="email"
            className="border rounded px-3 py-2"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <select
            className="border rounded px-3 py-2"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
          <Button
            type="submit"
            variant="primary"
            className="bg-blue-600 text-white font-bold py-2 rounded shadow hover:bg-blue-700 transition"
          >
            Save Changes
          </Button>
        </form>
      </Modal>
    </PageLayout>
  );
}

export default Cashiers;
