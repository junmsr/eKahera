import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Background from '../components/layout/Background';
import Button from '../components/common/Button';
import Logo from '../components/common/Logo';
import DocumentVerification from '../components/ui/SuperAdmin/DocumentVerification';
import { api } from '../lib/api';
import Modal from '../components/modals/Modal';

function SuperAdmin() {
  const [activeTab, setActiveTab] = useState('verification');
  
  // temporary single sample store
  const sampleStores = [
    { id: 'sample-1', name: 'ABC Store', email: 'abc@store.com', status: 'approved' },
  ];

  const [stores, setStores] = useState(sampleStores);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState('');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, store: null });
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const navigate = useNavigate();
  const token = sessionStorage.getItem('auth_token');

  useEffect(() => {
    fetchStores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchStores = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api('/api/superadmin/stores', {
        headers: { Authorization: `Bearer ${token}` },
      });
      // if backend returns stores replace sample; otherwise keep sampleStores
      if (Array.isArray(res) && res.length > 0) {
        setStores(res);
      }
    } catch (err) {
      // keep sample store on error
      setError('Using sample data');
    } finally {
      setLoading(false);
    }
  };

  const updateLocalStatus = (id, status) => {
    setStores((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
  };

  const handleApprove = async (store) => {
    if (!store || store.status === 'approved') return;
    setActionLoadingId(store.id);
    setError('');
    try {
      await api(`/api/superadmin/stores/${store.id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      updateLocalStatus(store.id, 'approved');
    } catch (err) {
      // fallback to local update
      updateLocalStatus(store.id, 'approved');
      setError('Approve updated locally');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (store) => {
    if (!store || store.status === 'rejected') return;
    setActionLoadingId(store.id);
    setError('');
    try {
      await api(`/api/superadmin/stores/${store.id}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      updateLocalStatus(store.id, 'rejected');
    } catch (err) {
      // fallback to local update
      updateLocalStatus(store.id, 'rejected');
      setError('Reject updated locally');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleView = (store) => {
    navigate(`/superadmin/stores/${store.id}`);
  };

  const handleDelete = (store) => {
    setDeleteModal({ isOpen: true, store });
    setDeletePassword('');
  };

  const confirmDelete = async () => {
    if (!deleteModal.store || !deletePassword) return;

    setDeleteLoading(true);
    try {
      await api(`/api/superadmin/stores/${deleteModal.store.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password: deletePassword }),
      });

      // Remove store from local state
      setStores((prev) => prev.filter((s) => s.id !== deleteModal.store.id));
      setDeleteModal({ isOpen: false, store: null });
      setError('');
    } catch (err) {
      setError('Failed to delete store: ' + (err.message || 'Unknown error'));
    } finally {
      setDeleteLoading(false);
    }
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, store: null });
    setDeletePassword('');
  };

  return (
    <Background variant="gradientBlue" pattern="dots" floatingElements overlay>
      <div className="flex h-screen overflow-hidden">
        <div className="flex-1 flex flex-col h-screen">
          <header className="flex items-center justify-between px-6 py-6 bg-white/80 border-b border-blue-100 h-[72px]">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <Logo size={40} className="text-blue-700" />
                <span className="text-3xl font-extrabold text-black tracking-tight">
                  Super Admin Dashboard
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/profile')}
                className="p-3 rounded-full bg-white/60 shadow hover:bg-white/80 transition-colors"
                title="Profile"
              >
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
              <button
                onClick={() => {
                  sessionStorage.removeItem('auth_token');
                  sessionStorage.removeItem('user');
                  navigate('/');
                }}
                className="p-3 rounded-full bg-white/60 shadow hover:bg-red-100 transition-colors"
                title="Logout"
              >
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </header>

          <main className="flex-1 p-8 overflow-auto">
            {/* Tab Navigation */}
            <div className="bg-white border border-blue-100 rounded-2xl mb-6 shadow-lg">
              <div className="flex border-b border-blue-100">
                <button
                  onClick={() => setActiveTab('verification')}
                  className={`px-6 py-4 font-medium ${
                    activeTab === 'verification'
                      ? 'text-blue-700 border-b-2 border-blue-700'
                      : 'text-gray-600 hover:text-blue-700'
                  }`}
                >
                  Document Verification
                </button>
                <button
                  onClick={() => setActiveTab('stores')}
                  className={`px-6 py-4 font-medium ${
                    activeTab === 'stores'
                      ? 'text-blue-700 border-b-2 border-blue-700'
                      : 'text-gray-600 hover:text-blue-700'
                  }`}
                >
                  Store Management
                </button>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'verification' ? (
              <DocumentVerification />
            ) : (
              <div className="bg-white border border-blue-100 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-blue-700">Stores</h2>
                  <div className="flex items-center gap-2">
                    <Button label="Refresh" variant="secondary" onClick={fetchStores} />
                  </div>
                </div>

              {error && <div className="text-red-600 text-sm mb-4">{error}</div>}
              {loading ? (
                <div className="text-blue-600">Loading...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full table-auto border-separate" style={{ borderSpacing: 0 }}>
                    <thead>
                      <tr className="text-left text-blue-700">
                        <th className="py-4 px-6 border-b border-blue-100">Name</th>
                        <th className="py-4 px-6 border-b border-blue-100">Email</th>
                        <th className="py-4 px-6 border-b border-blue-100">Status</th>
                        <th className="py-4 px-6 border-b border-blue-100">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stores.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="py-6 px-6 text-center text-sm text-gray-500">
                            No stores found
                          </td>
                        </tr>
                      ) : (
                        stores.map((s) => (
                          <tr key={s.id} className="align-top">
                            <td className="py-5 px-6 border-b border-blue-50 text-black">{s.name}</td>
                            <td className="py-5 px-6 border-b border-blue-50 text-black">{s.email}</td>
                            <td className="py-5 px-6 border-b border-blue-50">
                              {s.status === 'approved' ? (
                                <span className="inline-block bg-green-50 text-green-600 px-3 py-1 rounded-full text-sm font-semibold">Active</span>
                              ) : s.status === 'suspended' ? (
                                <span className="inline-block bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-sm font-semibold">Suspended</span>
                              ) : s.status === 'rejected' ? (
                                <span className="inline-block bg-red-50 text-red-600 px-3 py-1 rounded-full text-sm font-semibold">Rejected</span>
                              ) : (
                                <span className="inline-block bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm font-semibold">Pending</span>
                              )}
                            </td>
                            <td className="py-5 px-6 border-b border-blue-50">
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => handleView(s)}
                                  className="text-blue-600 hover:underline text-sm"
                                >
                                  View
                                </button>

                                <Button
                                  label={s.status === 'approved' ? 'Approved' : 'Approve'}
                                  size="sm"
                                  variant={s.status === 'approved' ? 'secondary' : 'primary'}
                                  className={`rounded-full px-4 ${s.status === 'approved' ? 'opacity-60' : ''}`}
                                  onClick={() => handleApprove(s)}
                                  disabled={s.status === 'approved' || actionLoadingId === s.id}
                                />

                                <Button
                                  label={s.status === 'rejected' ? 'Rejected' : 'Reject'}
                                  size="sm"
                                  variant="danger"
                                  className={`rounded-full px-4 ${s.status === 'rejected' ? 'opacity-60' : ''}`}
                                  onClick={() => handleReject(s)}
                                  disabled={s.status === 'rejected' || actionLoadingId === s.id}
                                />

                                <Button
                                  label="Delete"
                                  size="sm"
                                  variant="danger"
                                  className="rounded-full px-4 bg-red-600 hover:bg-red-700"
                                  onClick={() => handleDelete(s)}
                                  disabled={actionLoadingId === s.id}
                                />
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        title="Confirm Store Deletion"
      >
        <div className="p-6">
          <div className="mb-4">
            <p className="text-gray-700 mb-2">
              Are you sure you want to delete the store <strong>{deleteModal.store?.name}</strong>?
            </p>
            <p className="text-red-600 text-sm">
              This action cannot be undone. All associated data including users, products, inventory, and sales records will be permanently deleted.
            </p>
          </div>

          <div className="mb-4">
            <label htmlFor="deletePassword" className="block text-sm font-medium text-gray-700 mb-2">
              Enter your password to confirm deletion:
            </label>
            <input
              type="password"
              id="deletePassword"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="Enter your password"
              disabled={deleteLoading}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              label="Cancel"
              variant="secondary"
              onClick={closeDeleteModal}
              disabled={deleteLoading}
            />
            <Button
              label={deleteLoading ? 'Deleting...' : 'Delete Store'}
              variant="danger"
              onClick={confirmDelete}
              disabled={!deletePassword || deleteLoading}
              className="bg-red-600 hover:bg-red-700"
            />
          </div>
        </div>
      </Modal>
    </Background>
  );
}

export default SuperAdmin;
