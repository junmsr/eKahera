import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Background from '../components/layout/Background';
import Button from '../components/common/Button';
import { api } from '../lib/api';

export default function SuperAdminView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // minimal sample store for the demo
  const sampleStore = {
    id: 'sample-1',
    name: 'John Doe',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+63 963 909 2810',
    storeName: 'John Doe',
    location: '123 Main St, City',
    established: '2020',
    documents: [
      { name: 'Business License.pdf', url: '#' },
      { name: 'Tax Certificate.pdf', url: '#' },
    ],
    verifiedDocuments: [
      { name: 'ID Verification.pdf', url: '#' },
      { name: 'Address Proof.pdf', url: '#' },
    ],
    account: {
      username: 'admin_abc',
      passwordHint: '******** (Last updated: 07/01/2025)',
      lastLogin: '07/15/2025 02:51 PST',
      createdAt: '06/15/2020',
      lastPasswordChange: '07/01/2025 09:15 PST',
      loginAttemptsToday: 2,
      storeAddress: 'Brgy 18, Rizal St. Cabangan Legazpi City',
      status: 'Active',
      sessionTimeout: '30 minutes',
    },
  };

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('auth_token');
        const res = await api(`/api/superadmin/stores/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        // if API returns an object use it, otherwise fallback
        if (res && typeof res === 'object' && Object.keys(res).length) {
          setStore(res);
        } else {
          setStore(sampleStore);
        }
      } catch (err) {
        setError('Using sample data');
        setStore(sampleStore);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="min-h-screen p-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-extrabold text-gray-800">Tenant Review</h1>
            <div className="flex gap-2">
              <Button label="Back to List" variant="secondary" onClick={() => navigate('/superadmin')} />
            </div>
          </div>

          {error && <div className="text-sm text-red-600 mb-4">{error}</div>}

          {/* Overview */}
          <section className="mb-8">
            <h2 className="text-gray-800 font-semibold mb-4 text-lg">Overview</h2>
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="font-medium text-gray-600">First Name:</span>
                  <span className="text-gray-800">{store.firstName || store.name || ''}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="font-medium text-gray-600">Last Name:</span>
                  <span className="text-gray-800">{store.lastName || ''}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="font-medium text-gray-600">Email:</span>
                  <span className="text-gray-800">{store.email || ''}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="font-medium text-gray-600">Phone:</span>
                  <span className="text-gray-800">{store.phone || ''}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Store Details */}
          <section className="mb-8">
            <h2 className="text-gray-800 font-semibold mb-4 text-lg">Store Details</h2>
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="font-medium text-gray-600">Store Name:</span>
                  <span className="text-gray-800">{store.storeName || store.name || ''}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="font-medium text-gray-600">Location:</span>
                  <span className="text-gray-800">{store.location || ''}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="font-medium text-gray-600">Established:</span>
                  <span className="text-gray-800">{store.established || ''}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Store Documents */}
          <section className="mb-8">
            <h2 className="text-gray-800 font-semibold mb-4 text-lg">Store Documents</h2>
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="space-y-3">
                {(store.documents || []).map((d, i) => (
                  <a key={i} href={d.url || '#'} className="flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors" download>
                    <span className="font-medium">{d.name}</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </a>
                ))}
                {(!store.documents || store.documents.length === 0) && (
                  <div className="text-gray-500 text-center py-4">No documents available</div>
                )}
              </div>
            </div>
          </section>

          {/* Verified Documents */}
          <section className="mb-8">
            <h2 className="text-gray-800 font-semibold mb-4 text-lg">Verified Documents</h2>
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="space-y-3">
                {(store.verifiedDocuments || []).map((d, i) => (
                  <a key={i} href={d.url || '#'} className="flex items-center justify-between p-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors" download>
                    <span className="font-medium">{d.name}</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </a>
                ))}
                {(!store.verifiedDocuments || store.verifiedDocuments.length === 0) && (
                  <div className="text-gray-500 text-center py-4">No verified documents available</div>
                )}
              </div>
            </div>
          </section>

          {/* Account Details */}
          <section className="mb-8">
            <h2 className="text-gray-800 font-semibold mb-4 text-lg">Account Details</h2>
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="font-medium text-gray-600">Username:</span>
                  <span className="text-gray-800">{store.account?.username || ''}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="font-medium text-gray-600">Password:</span>
                  <span className="text-gray-800">{store.account?.passwordHint || ''}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="font-medium text-gray-600">Last Login:</span>
                  <span className="text-gray-800">{store.account?.lastLogin || ''}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="font-medium text-gray-600">Account Creation Date:</span>
                  <span className="text-gray-800">{store.account?.createdAt || ''}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="font-medium text-gray-600">Last Password Change:</span>
                  <span className="text-gray-800">{store.account?.lastPasswordChange || ''}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="font-medium text-gray-600">Login Attempts Today:</span>
                  <span className="text-gray-800">{store.account?.loginAttemptsToday ?? ''}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="font-medium text-gray-600">Store Address:</span>
                  <span className="text-gray-800">{store.account?.storeAddress || ''}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="font-medium text-gray-600">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    (store.account?.status || store.status) === 'Active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {store.account?.status || store.status || ''}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="font-medium text-gray-600">Session Timeout:</span>
                  <span className="text-gray-800">{store.account?.sessionTimeout || ''}</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}