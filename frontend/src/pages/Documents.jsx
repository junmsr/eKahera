import React, { useState, useEffect } from "react";
import PageLayout from "../components/layout/PageLayout";
import NavAdmin from "../components/layout/Nav-Admin";
import Card from "../components/common/Card";
import Loader from "../components/common/Loader";
import { api, authHeaders } from "../lib/api";
import Button from "../components/common/Button";

/**
 * Documents Page Component
 * Displays and manages business documents for the logged-in user
 */
const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError("");

      const token = sessionStorage.getItem("auth_token");
      const user = JSON.parse(sessionStorage.getItem("user") || "{}");
      const businessId = user.businessId || user.business_id;

      if (!token) {
        throw new Error("No authentication token found");
      }

      if (!businessId) {
        throw new Error("Business ID not found");
      }

      const data = await api(`/documents/business/${businessId}`, {
        headers: authHeaders(token),
      });

      setDocuments(Array.isArray(data.documents) ? data.documents : []);
    } catch (err) {
      console.error("Failed to fetch documents:", err);
      setError(
        err.message || "Failed to load documents. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const downloadDocument = async (documentId, fileName) => {
    setDownloading(documentId);
    try {
      const token = sessionStorage.getItem("auth_token");
      const response = await api(
        `/documents/download/${documentId}`,
        {
          headers: authHeaders(token),
        },
        true // returnRawResponse = true
      );
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Error downloading document');
    } finally {
      setDownloading(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'repass': return 'text-orange-600 bg-orange-100';
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

  // Header actions
  const headerActions = (
    <div className="flex flex-wrap gap-3">
      <button
        onClick={fetchDocuments}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
      >
        Refresh Documents
      </button>
    </div>
  );

  if (loading) {
    return (
      <PageLayout
        title="DOCUMENTS"
        subtitle="View and manage your business documents"
        sidebar={<NavAdmin />}
        className="bg-gray-50"
      >
        <div className="flex justify-center items-center h-64">
          <Loader />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="DOCUMENTS"
      subtitle="View and manage your business documents"
      sidebar={<NavAdmin />}
      headerActions={headerActions}
      className="bg-gray-50"
    >
      <div className="p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-red-400 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && documents.length === 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Documents Available
            </h3>
            <p className="text-gray-600 mb-4">
              You haven't uploaded any business documents yet.
            </p>
            <button
              onClick={fetchDocuments}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Refresh
            </button>
          </div>
        )}

        {/* Documents List */}
        {documents.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((document) => (
              <Card key={document.document_id} className="bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {document.document_type}
                      </h3>
                      <p className="text-sm text-gray-600 truncate">
                        {document.document_name}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(document.verification_status)}`}>
                      {document.verification_status}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div>
                      <span className="font-medium">Uploaded:</span>
                      <div className="text-gray-900">
                        {formatDate(document.uploaded_at)}
                      </div>
                    </div>
                    {document.verification_notes && (
                      <div>
                        <span className="font-medium">Notes:</span>
                        <div className="text-gray-900 mt-1">
                          {document.verification_notes}
                        </div>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={() => downloadDocument(document.document_id, document.document_name)}
                    disabled={downloading === document.document_id}
                    className="w-full"
                    size="sm"
                  >
                    {downloading === document.document_id ? "Downloading..." : "Download"}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default Documents;
