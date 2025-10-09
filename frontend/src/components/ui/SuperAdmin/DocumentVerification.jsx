import React, { useState, useEffect } from 'react';
import Button from '../../common/Button';
import Card from '../../common/Card';
import Loader from '../../common/Loader';

export default function DocumentVerification() {
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [businessDetails, setBusinessDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [stats, setStats] = useState({});

  useEffect(() => {
    fetchPendingVerifications();
    fetchStats();
  }, []);

  const fetchPendingVerifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/documents/pending', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPendingVerifications(data);
      }
    } catch (error) {
      console.error('Error fetching pending verifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/documents/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchBusinessDetails = async (businessId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:5000/api/documents/business/${businessId}/verification`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setBusinessDetails(data);
      }
    } catch (error) {
      console.error('Error fetching business details:', error);
    }
  };

  const handleSelectBusiness = (business) => {
    setSelectedBusiness(business);
    fetchBusinessDetails(business.business_id);
  };

  const handleDocumentAction = async (documentId, action, notes = '') => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:5000/api/documents/document/${documentId}/verify`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: action,
            notes: notes
          })
        }
      );

      if (response.ok) {
        // Refresh business details
        fetchBusinessDetails(selectedBusiness.business_id);
        alert(`Document ${action} successfully`);
      } else {
        alert('Failed to update document status');
      }
    } catch (error) {
      console.error('Error updating document:', error);
      alert('Error updating document status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteVerification = async (status, reason = '', notes = '') => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:5000/api/documents/business/${selectedBusiness.business_id}/complete`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: status,
            rejection_reason: reason,
            resubmission_notes: notes
          })
        }
      );

      if (response.ok) {
        alert(`Business verification ${status} successfully`);
        setSelectedBusiness(null);
        setBusinessDetails(null);
        fetchPendingVerifications();
        fetchStats();
      } else {
        alert('Failed to complete verification');
      }
    } catch (error) {
      console.error('Error completing verification:', error);
      alert('Error completing verification');
    } finally {
      setActionLoading(false);
    }
  };

  const downloadDocument = async (documentId, fileName) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:5000/api/documents/download/${documentId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        alert('Failed to download document');
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Error downloading document');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending || 0}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.approved || 0}</div>
            <div className="text-sm text-gray-600">Approved</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.rejected || 0}</div>
            <div className="text-sm text-gray-600">Rejected</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.repass || 0}</div>
            <div className="text-sm text-gray-600">Repass</div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Verifications List */}
        <div className="lg:col-span-1">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Pending Verifications</h3>
            {pendingVerifications.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No pending verifications</p>
            ) : (
              <div className="space-y-3">
                {pendingVerifications.map((business) => (
                  <div
                    key={business.business_id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedBusiness?.business_id === business.business_id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleSelectBusiness(business)}
                  >
                    <div className="font-medium">{business.business_name}</div>
                    <div className="text-sm text-gray-600">{business.business_type}</div>
                    <div className="text-xs text-gray-500">
                      {business.total_documents} documents • 
                      Submitted {new Date(business.submitted_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Business Details and Documents */}
        <div className="lg:col-span-2">
          {selectedBusiness ? (
            <BusinessVerificationDetails
              business={businessDetails}
              onDocumentAction={handleDocumentAction}
              onCompleteVerification={handleCompleteVerification}
              onDownloadDocument={downloadDocument}
              actionLoading={actionLoading}
            />
          ) : (
            <Card className="p-6">
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📋</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select a Business to Review
                </h3>
                <p className="text-gray-500">
                  Choose a business from the pending verifications list to review their documents.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// Business Verification Details Component
function BusinessVerificationDetails({ 
  business, 
  onDocumentAction, 
  onCompleteVerification, 
  onDownloadDocument,
  actionLoading 
}) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [resubmissionNotes, setResubmissionNotes] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showRepassModal, setShowRepassModal] = useState(false);

  if (!business) {
    return (
      <Card className="p-6">
        <div className="flex justify-center items-center h-32">
          <Loader />
        </div>
      </Card>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'repass': return 'text-orange-600 bg-orange-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  const allDocumentsApproved = business.documents?.every(doc => doc.verification_status === 'approved');
  const hasRejectedOrRepass = business.documents?.some(doc => 
    doc.verification_status === 'rejected' || doc.verification_status === 'repass'
  );

  return (
    <div className="space-y-6">
      {/* Business Information */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Business Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Business Name</label>
            <p className="text-gray-900">{business.business_name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Business Type</label>
            <p className="text-gray-900">{business.business_type}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <p className="text-gray-900">{business.business_email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Mobile</label>
            <p className="text-gray-900">{business.mobile}</p>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Address</label>
            <p className="text-gray-900">
              {business.business_address}
              {business.house_number && `, ${business.house_number}`}
              , {business.country}
            </p>
          </div>
        </div>
      </Card>

      {/* Documents */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Submitted Documents</h3>
        {business.documents?.length === 0 ? (
          <p className="text-gray-500">No documents uploaded</p>
        ) : (
          <div className="space-y-4">
            {business.documents?.map((document) => (
              <div key={document.document_id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-medium">{document.document_type}</h4>
                    <p className="text-sm text-gray-600">{document.document_name}</p>
                    <p className="text-xs text-gray-500">
                      Uploaded {new Date(document.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(document.verification_status)}`}>
                    {document.verification_status}
                  </span>
                </div>

                {document.verification_notes && (
                  <div className="mb-3 p-2 bg-gray-50 rounded text-sm">
                    <strong>Notes:</strong> {document.verification_notes}
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDownloadDocument(document.document_id, document.document_name)}
                  >
                    Download
                  </Button>
                  {document.verification_status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => onDocumentAction(document.document_id, 'approved')}
                        disabled={actionLoading}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const notes = prompt('Enter notes for rejection:');
                          if (notes !== null) {
                            onDocumentAction(document.document_id, 'rejected', notes);
                          }
                        }}
                        disabled={actionLoading}
                      >
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const notes = prompt('Enter notes for repass (document quality issues):');
                          if (notes !== null) {
                            onDocumentAction(document.document_id, 'repass', notes);
                          }
                        }}
                        disabled={actionLoading}
                      >
                        Repass
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Verification Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Complete Verification</h3>
        <div className="flex space-x-3">
          <Button
            onClick={() => onCompleteVerification('approved')}
            disabled={!allDocumentsApproved || actionLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            Approve Business
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowRejectModal(true)}
            disabled={actionLoading}
          >
            Reject Application
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowRepassModal(true)}
            disabled={actionLoading}
          >
            Request Resubmission
          </Button>
        </div>
        
        {!allDocumentsApproved && !hasRejectedOrRepass && (
          <p className="text-sm text-gray-600 mt-2">
            All documents must be reviewed before completing verification.
          </p>
        )}
      </Card>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Reject Application</h3>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter reason for rejection..."
              className="w-full p-3 border rounded-lg resize-none h-32"
            />
            <div className="flex justify-end space-x-3 mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  onCompleteVerification('rejected', rejectionReason);
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
                disabled={!rejectionReason.trim()}
                className="bg-red-600 hover:bg-red-700"
              >
                Reject
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Repass Modal */}
      {showRepassModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Request Resubmission</h3>
            <textarea
              value={resubmissionNotes}
              onChange={(e) => setResubmissionNotes(e.target.value)}
              placeholder="Enter notes about document quality issues..."
              className="w-full p-3 border rounded-lg resize-none h-32"
            />
            <div className="flex justify-end space-x-3 mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRepassModal(false);
                  setResubmissionNotes('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  onCompleteVerification('repass', '', resubmissionNotes);
                  setShowRepassModal(false);
                  setResubmissionNotes('');
                }}
                disabled={!resubmissionNotes.trim()}
                className="bg-orange-600 hover:bg-orange-700"
              >
                Request Resubmission
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
