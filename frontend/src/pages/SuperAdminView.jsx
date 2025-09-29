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
      <Background variant="gradientBlue" pattern="dots" floatingElements overlay>
        <div className="p-8">Loading...</div>
      </Background>
    );
  }

  return (
    <Background variant="gradientBlue" pattern="dots" floatingElements overlay>
      <div className="min-h-screen p-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-extrabold text-blue-700">Tenant Review</h1>
            <div className="flex gap-2">
              <Button label="Back to List" variant="secondary" onClick={() => navigate('/superadmin')} />
            </div>
          </div>

          {error && <div className="text-sm text-red-600 mb-4">{error}</div>}

          {/* Overview */}
          <section className="mb-6">
            <h2 className="text-blue-600 font-semibold mb-3">Overview</h2>
            <div className="space-y-2">
              <div className="bg-gray-100 px-3 py-2 rounded">{`First Name: ${store.firstName || store.name || ''}`}</div>
              <div className="bg-gray-100 px-3 py-2 rounded">{`Last Name: ${store.lastName || ''}`}</div>
              <div className="bg-gray-100 px-3 py-2 rounded">{`Email: ${store.email || ''}`}</div>
              <div className="bg-gray-100 px-3 py-2 rounded">{`Phone: ${store.phone || ''}`}</div>
            </div>
          </section>

          {/* Store Details */}
          <section className="mb-6">
            <h2 className="text-blue-600 font-semibold mb-3">Store Details</h2>
            <div className="space-y-2">
              <div className="bg-gray-100 px-3 py-2 rounded">{`Store Name: ${store.storeName || store.name || ''}`}</div>
              <div className="bg-gray-100 px-3 py-2 rounded">{`Location: ${store.location || ''}`}</div>
              <div className="bg-gray-100 px-3 py-2 rounded">{`Established: ${store.established || ''}`}</div>
            </div>
          </section>

          {/* Store Documents */}
          <section className="mb-6">
            <h2 className="text-blue-600 font-semibold mb-3">Store Documents</h2>
            <div className="space-y-2">
              {(store.documents || []).map((d, i) => (
                <a key={i} href={d.url || '#'} className="block bg-blue-50 text-blue-700 px-3 py-2 rounded" download>
                  {d.name}
                </a>
              ))}
            </div>
          </section>

          {/* Verified Documents */}
          <section className="mb-6">
            <h2 className="text-blue-600 font-semibold mb-3">Verified Documents</h2>
            <div className="space-y-2">
              {(store.verifiedDocuments || []).map((d, i) => (
                <a key={i} href={d.url || '#'} className="block bg-blue-50 text-blue-700 px-3 py-2 rounded" download>
                  {d.name}
                </a>
              ))}
            </div>
          </section>

          {/* Account / Store Details */}
          <section className="mb-6">
            <h2 className="text-blue-600 font-semibold mb-3">Store Details</h2>
            <div className="space-y-2">
              <div className="bg-gray-100 px-3 py-2 rounded">{`Username: ${store.account?.username || ''}`}</div>
              <div className="bg-gray-100 px-3 py-2 rounded">{`Password: ${store.account?.passwordHint || ''}`}</div>
              <div className="bg-gray-100 px-3 py-2 rounded">{`Last Login: ${store.account?.lastLogin || ''}`}</div>
              <div className="bg-gray-100 px-3 py-2 rounded">{`Account Creation Date: ${store.account?.createdAt || ''}`}</div>
              <div className="bg-gray-100 px-3 py-2 rounded">{`Last Password Change: ${store.account?.lastPasswordChange || ''}`}</div>
              <div className="bg-gray-100 px-3 py-2 rounded">{`Login Attempts Today: ${store.account?.loginAttemptsToday ?? ''}`}</div>
              <div className="bg-gray-100 px-3 py-2 rounded">{`Store Address: ${store.account?.storeAddress || ''}`}</div>
              <div className="bg-gray-100 px-3 py-2 rounded">{`Status: ${store.account?.status || store.status || ''}`}</div>
              <div className="bg-gray-100 px-3 py-2 rounded">{`Session Timeout: ${store.account?.sessionTimeout || ''}`}</div>
            </div>
          </section>
        </div>
      </div>
    </Background>
  );
}