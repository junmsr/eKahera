import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageLayout from "../components/layout/PageLayout";
import NavAdmin from "../components/layout/Nav-Admin";
import Button from "../components/common/Button";
import { api, authHeaders } from "../lib/api";
import Loader from "../components/common/Loader";

/**
 * Document Resubmission Page
 * Allows users to resubmit rejected documents
 */
const DocumentResubmission = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState({});
  const [selectedFiles, setSelectedFiles] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem("auth_token");
      const user = JSON.parse(sessionStorage.getItem("user") || "{}");
      const businessId = user.businessId || user.business_id;

      if (!token) {
        throw new Error("No authentication token found");
      }

      const data = await api(`/documents/business/${businessId}`, {
        headers: authHeaders(token),
      });

      // Filter for rejected documents
      const rejectedDocs = Array.isArray(data.documents) 
        ? data.documents.filter(doc => doc.verification_status === 'rejected')
        : [];

      setDocuments(rejectedDocs);
    } catch (err) {
      console.error("Failed to fetch documents:", err);
      setError("Failed to load documents. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (documentId, file) => {
    setSelectedFiles(prev => ({
      ...prev,
      [documentId]: file
    }));
  };

  const handleResubmit = async (documentId) => {
    if (!selectedFiles[documentId]) {
      setError("Please select a file to upload");
      return;
    }

    const formData = new FormData();
    formData.append('document', selectedFiles[documentId]);
    formData.append('document_id', documentId);

    try {
      setUploading(prev => ({ ...prev, [documentId]: true }));
      const token = sessionStorage.getItem("auth_token");
      
      await api(`/documents/resubmit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      // Refresh the documents list
      await fetchDocuments();
      setSelectedFiles(prev => {
        const newFiles = { ...prev };
        delete newFiles[documentId];
        return newFiles;
      });
      
    } catch (error) {
      console.error("Failed to resubmit document:", error);
      setError(error.message || "Failed to resubmit document. Please try again.");
    } finally {
      setUploading(prev => ({ ...prev, [documentId]: false }));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <PageLayout
        title="RESUBMIT DOCUMENTS"
        subtitle="Resubmit your rejected documents"
        sidebar={<NavAdmin />}
      >
        <div className="flex justify-center items-center h-64">
          <Loader />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="RESUBMIT DOCUMENTS"
      subtitle="Resubmit your rejected documents"
      sidebar={<NavAdmin />}
    >
      <div className="p-6 max-w-4xl mx-auto">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {documents.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No documents require resubmission
            </h3>
            <p className="text-gray-600 mb-6">
              All your documents are up to date.
            </p>
            <Button onClick={() => navigate('/documents')}>
              View All Documents
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h2a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    Please upload new versions of your rejected documents. Make sure all documents are clear and up to date.
                  </p>
                </div>
              </div>
            </div>

            {documents.map((doc) => (
              <div key={doc.document_id} className="bg-white shadow overflow-hidden rounded-lg">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        {doc.document_type}
                      </h3>
                      <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        {doc.document_name}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(doc.verification_status)}`}>
                      {doc.verification_status}
                    </span>
                  </div>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  {doc.verification_notes && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700">Rejection Reason:</h4>
                      <p className="mt-1 text-sm text-gray-600">{doc.verification_notes}</p>
                    </div>
                  )}
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload new version
                    </label>
                    <div className="flex items-center">
                      <input
                        type="file"
                        onChange={(e) => handleFileChange(doc.document_id, e.target.files[0])}
                        className="block w-full text-sm text-gray-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-md file:border-0
                          file:text-sm file:font-semibold
                          file:bg-blue-50 file:text-blue-700
                          hover:file:bg-blue-100"
                        accept=".pdf,.jpg,.jpeg,.png"
                      />
                      <Button
                        onClick={() => handleResubmit(doc.document_id)}
                        disabled={!selectedFiles[doc.document_id] || uploading[doc.document_id]}
                        className="ml-4 whitespace-nowrap"
                        loading={uploading[doc.document_id]}
                      >
                        {uploading[doc.document_id] ? 'Uploading...' : 'Resubmit'}
                      </Button>
                    </div>
                    {selectedFiles[doc.document_id] && (
                      <p className="mt-2 text-sm text-gray-500">
                        Selected: {selectedFiles[doc.document_id].name}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default DocumentResubmission;
