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
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-blue-100 p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">Tenant Review</h1>
                  <p className="text-gray-600 mt-1">Comprehensive business verification details</p>
                </div>
              </div>
              <Button 
                label="Back to List" 
                variant="secondary" 
                onClick={() => navigate('/superadmin')}
                className="shadow-md hover:shadow-lg transition-all duration-300"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 shadow-sm">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-red-700 font-medium">{error}</span>
              </div>
            </div>
          )}

          {/* Overview */}
          <section className="mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-blue-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-800">Personal Overview</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">First Name</p>
                      <p className="font-semibold text-gray-800">{store.firstName || store.name || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Last Name</p>
                      <p className="font-semibold text-gray-800">{store.lastName || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-semibold text-gray-800">{store.email || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-semibold text-gray-800">{store.phone || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Store Details */}
          <section className="mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-blue-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-800">Business Information</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Store Name</p>
                      <p className="font-semibold text-gray-800">{store.storeName || store.name || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Location</p>
                      <p className="font-semibold text-gray-800">{store.location || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Established</p>
                      <p className="font-semibold text-gray-800">{store.established || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Documents Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Store Documents */}
            <section>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-blue-100 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">Business Documents</h2>
                </div>
                <div className="space-y-3">
                  {(store.documents || []).map((d, i) => (
                    <a 
                      key={i} 
                      href={d.url || '#'} 
                      className="flex items-center gap-3 p-4 bg-blue-50/50 hover:bg-blue-100/50 text-blue-700 rounded-xl border border-blue-100 transition-all duration-300 hover:shadow-md group" 
                      download
                    >
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{d.name}</p>
                        <p className="text-sm text-blue-600">Click to download</p>
                      </div>
                      <svg className="w-5 h-5 text-blue-500 group-hover:text-blue-700 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  ))}
                  {(!store.documents || store.documents.length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                      <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p>No documents available</p>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Verified Documents */}
            <section>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-blue-100 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">Verified Documents</h2>
                </div>
                <div className="space-y-3">
                  {(store.verifiedDocuments || []).map((d, i) => (
                    <a 
                      key={i} 
                      href={d.url || '#'} 
                      className="flex items-center gap-3 p-4 bg-green-50/50 hover:bg-green-100/50 text-green-700 rounded-xl border border-green-100 transition-all duration-300 hover:shadow-md group" 
                      download
                    >
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{d.name}</p>
                        <p className="text-sm text-green-600">Verified & ready</p>
                      </div>
                      <svg className="w-5 h-5 text-green-500 group-hover:text-green-700 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  ))}
                  {(!store.verifiedDocuments || store.verifiedDocuments.length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                      <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p>No verified documents</p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* Account Details */}
          <section className="mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-blue-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-800">Account & Security</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Username</p>
                      <p className="font-semibold text-gray-800">{store.account?.username || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Password</p>
                      <p className="font-semibold text-gray-800">{store.account?.passwordHint || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Last Login</p>
                      <p className="font-semibold text-gray-800">{store.account?.lastLogin || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Created</p>
                      <p className="font-semibold text-gray-800">{store.account?.createdAt || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Password Changed</p>
                      <p className="font-semibold text-gray-800">{store.account?.lastPasswordChange || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Login Attempts</p>
                      <p className="font-semibold text-gray-800">{store.account?.loginAttemptsToday ?? 'N/A'}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 hover:shadow-md transition-all duration-300 md:col-span-2 lg:col-span-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">Store Address</p>
                      <p className="font-semibold text-gray-800">{store.account?.storeAddress || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <p className="font-semibold text-gray-800">{store.account?.status || store.status || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Session Timeout</p>
                      <p className="font-semibold text-gray-800">{store.account?.sessionTimeout || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </Background>
  );
}