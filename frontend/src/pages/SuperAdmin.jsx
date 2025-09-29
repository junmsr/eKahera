import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Background from '../components/layout/Background';
import Button from '../components/common/Button';
import { api } from '../lib/api';

function SuperAdmin() {
  // temporary single sample store
  const sampleStores = [
    { id: 'sample-1', name: 'ABC Store', email: 'abc@store.com', status: 'approved' },
  ];

  const [stores, setStores] = useState(sampleStores);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const token = localStorage.getItem('auth_token');

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

  return (
    <Background variant="gradientBlue" pattern="dots" floatingElements overlay>
      <div className="flex h-screen overflow-hidden">
        <div className="flex-1 flex flex-col h-screen">
          <header className="flex items-center justify-between px-6 py-6 bg-white/80 border-b border-blue-100 h-[72px]">
            <div className="flex items-center gap-4">
              <span className="text-3xl font-extrabold text-blue-700 tracking-tight flex items-center gap-3">
                <span className="bg-blue-600 text-white rounded-xl px-3 py-1 text-xl font-bold">eK</span>
                Super Admin Dashboard
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-3 rounded-full bg-white/60 shadow">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
            </div>
          </header>

          <main className="flex-1 p-8 overflow-auto">
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
                            <td className="py-5 px-6 border-b border-blue-50 text-blue-600">{s.name}</td>
                            <td className="py-5 px-6 border-b border-blue-50 text-blue-600">{s.email}</td>
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
          </main>
        </div>
      </div>
    </Background>
  );
}

export default SuperAdmin;