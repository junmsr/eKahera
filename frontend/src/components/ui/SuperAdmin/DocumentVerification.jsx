import React, { useState, useEffect } from "react";
import { api } from "../../../lib/api";
import Button from "../../common/Button";
import Card from "../../common/Card";
import Loader from "../../common/Loader";
import DocumentViewerModal from "../../modals/DocumentViewerModal";
import SuperadminAlertModal from "../../modals/SuperadminAlertModal";

export default function DocumentVerification({ isRefreshing }) {
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [businessDetails, setBusinessDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState({
    url: "",
    name: "",
    isOpen: false,
  });
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  useEffect(() => {
    fetchPendingVerifications();
    fetchStats();
  }, []);

  useEffect(() => {
    if (isRefreshing) {
      fetchPendingVerifications();
      fetchStats();
    }
  }, [isRefreshing]);

  const fetchPendingVerifications = async () => {
    setIsFetching(true);
    try {
      // Using sessionStorage and api utility from 'main' branch
      const token = sessionStorage.getItem("auth_token");
      const data = await api("/documents/pending", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPendingVerifications(data);
    } catch (error) {
      // console.error("Error fetching pending verifications:", error);
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  };

  const fetchStats = async () => {
    setIsFetching(true);
    try {
      // Using sessionStorage and api utility from 'main' branch
      const token = sessionStorage.getItem("auth_token");
      const data = await api("/documents/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Keeping the filtering logic from 'new-nigga-dave' and 'main'
      const filteredStats = {
        total: data.total || 0,
        pending: data.pending || 0,
        approved: data.approved || 0,
        rejected: data.rejected || 0,
        repass: data.repass || 0,
      };
      setStats(filteredStats);
    } catch (error) {
      // console.error("Error fetching stats:", error);
    } finally {
      setIsFetching(false);
    }
  };

  const fetchBusinessDetails = async (businessId) => {
    try {
      // Using sessionStorage and api utility from 'main' branch
      const token = sessionStorage.getItem("auth_token");
      const data = await api(`/documents/business/${businessId}/verification`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBusinessDetails(data);
    } catch (error) {
      // console.error("Error fetching business details:", error);
    }
  };

  const handleSelectBusiness = (business) => {
    setSelectedBusiness(business);
    fetchBusinessDetails(business.business_id);
  };

  const handleDocumentAction = async (documentId, action, notes = "") => {
    setActionLoading(true);
    try {
      const token = sessionStorage.getItem("auth_token");
      await api(`/documents/document/${documentId}/verify`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: action, notes: notes }),
      });
      // Refresh business details and show success message
      fetchBusinessDetails(selectedBusiness.business_id);
      setAlert({
        isOpen: true,
        title: "Success",
        message: `Document ${action} successfully`,
        type: "success",
      });
    } catch (error) {
      console.error("Error updating document:", error);
      setAlert({
        isOpen: true,
        title: "Error",
        message: "Error updating document status",
        type: "error",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteVerification = async (status, reason = "") => {
    setActionLoading(true);
    try {
      const token = sessionStorage.getItem("auth_token");
      await api(
        `/documents/business/${selectedBusiness.business_id}/complete`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            status: status,
            rejection_reason: reason,
          }),
        }
      );

      // Show success message
      setAlert({
        isOpen: true,
        title: "Success",
        message: `Business verification ${status} successfully`,
        type: "success",
        onClose: () => {
          setSelectedBusiness(null);
          setBusinessDetails(null);
          fetchPendingVerifications();
          fetchStats();
        },
      });
    } catch (error) {
      console.error("Error completing verification:", error);
      setAlert({
        isOpen: true,
        title: "Error",
        message: "Error completing verification",
        type: "error",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const downloadDocument = async (documentId, fileName) => {
    try {
      const token = sessionStorage.getItem("auth_token");
      const response = await api(
        `/documents/download/${documentId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
        true // returnRawResponse = true
      );

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading document:", error);
      setAlert({
        isOpen: true,
        title: "Error",
        message: error.message || "Error downloading document",
        type: "error",
      });
    }
  };

  const viewDocument = async (documentId, fileName) => {
    try {
      const token = sessionStorage.getItem("auth_token");
      const response = await api(
        `/documents/download/${documentId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
        true // returnRawResponse = true
      );

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setSelectedDocument({
        url,
        name: fileName,
        isOpen: true,
      });
    } catch (error) {
      console.error("Error viewing document:", error);
      setAlert({
        isOpen: true,
        title: "Error",
        message: "Error viewing document",
        type: "error",
      });
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
      {isFetching && (
        <div className="fixed inset-0 bg-black bg-opacity-10 flex items-center justify-center z-50">
          <Loader size="lg" />
        </div>
      )}
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {stats.total ||
                (stats.pending || 0) +
                  (stats.approved || 0) +
                  (stats.rejected || 0)}
            </div>
            <div className="text-sm text-gray-600">Total Businesses</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {stats.pending || 0}
            </div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {stats.approved || 0}
            </div>
            <div className="text-sm text-gray-600">Approved</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {stats.rejected || 0}
            </div>
            <div className="text-sm text-gray-600">Rejected</div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Verifications List */}
        <div className="lg:col-span-1">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              All Businesses with Documents
            </h3>
            {pendingVerifications.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No businesses with documents
              </p>
            ) : (
              <div className="space-y-3">
                {pendingVerifications.map((business) => (
                  <div
                    key={business.business_id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedBusiness?.business_id === business.business_id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => handleSelectBusiness(business)}
                  >
                    <div className="font-medium">{business.business_name}</div>
                    <div className="text-sm text-gray-600">
                      {business.business_type}
                    </div>
                    <div className="text-xs text-gray-500">
                      {business.total_documents} documents • Status:{" "}
                      {business.verification_status}
                    </div>
                    <div className="text-xs text-gray-500">
                      Submitted{" "}
                      {business.verification_submitted_at
                        ? new Date(
                            business.verification_submitted_at
                          ).toLocaleDateString()
                        : "N/A"}
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
              onViewDocument={viewDocument}
              actionLoading={actionLoading}
            />
          ) : (
            <Card className="p-6">
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select a Business to Review
                </h3>
                <p className="text-gray-500">
                  Choose a business from the list to review their documents.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Document Viewer Modal */}
      <DocumentViewerModal
        isOpen={selectedDocument.isOpen}
        onClose={() =>
          setSelectedDocument((prev) => ({ ...prev, isOpen: false }))
        }
        documentUrl={selectedDocument.url}
        documentName={selectedDocument.name}
      />

      {/* Alert Modal */}
      <SuperadminAlertModal
        isOpen={alert.isOpen}
        onClose={() => {
          setAlert((prev) => ({ ...prev, isOpen: false }));
          if (alert.onClose) alert.onClose();
        }}
        title={alert.title}
        message={alert.message}
        type={alert.type}
      />
    </div>
  );
}

// Business Verification Details Component
function BusinessVerificationDetails({
  business,
  onDocumentAction,
  onCompleteVerification,
  onDownloadDocument,
  onViewDocument,
  actionLoading,
}) {
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showRepassModal, setShowRepassModal] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [alert, setAlert] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

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
      case "approved":
        return "text-green-600 bg-green-100";
      case "rejected":
        return "text-red-600 bg-red-100";
      default:
        return "text-yellow-600 bg-yellow-100";
    }
  };

  // Check if all documents are either approved or rejected (none pending)
  const allDocumentsReviewed = business.documents?.every(
    (doc) =>
      doc.verification_status === "approved" ||
      doc.verification_status === "rejected"
  );
  const allDocumentsApproved = business.documents?.every(
    (doc) => doc.verification_status === "approved"
  );
  const hasRejected = business.documents?.some(
    (doc) => doc.verification_status === "rejected"
  );

  return (
    <div className="space-y-6">
      {/* Business Information */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Business Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Business Name
            </label>
            <p className="text-gray-900">{business.business_name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Business Type
            </label>
            <p className="text-gray-900">{business.business_type}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <p className="text-gray-900">{business.business_email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Mobile
            </label>
            <p className="text-gray-900">{business.mobile}</p>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Address
            </label>
            <p className="text-gray-900">
              {business.business_address}
              {business.house_number && `, ${business.house_number}`},{" "}
              {business.country}
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
                    <p className="text-sm text-gray-600">
                      {document.document_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Uploaded{" "}
                      {new Date(document.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      document.verification_status
                    )}`}
                  >
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
                    onClick={() =>
                      onViewDocument(
                        document.document_id,
                        document.document_name || document.document_type
                      )
                    }
                  >
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      onDownloadDocument(
                        document.document_id,
                        document.document_name
                      )
                    }
                  >
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Download
                  </Button>
                  {document.verification_status === "pending" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() =>
                          onDocumentAction(document.document_id, "approved")
                        }
                        disabled={actionLoading}
                      >
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          onDocumentAction(document.document_id, "rejected")
                        }
                        disabled={actionLoading}
                      >
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Verification Actions - Only show if business is not approved and not rejected */}
      {business.verification_status === "pending" && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Complete Verification</h3>
          <div className="flex space-x-3">
            <Button
              onClick={() => onCompleteVerification("approved")}
              disabled={!allDocumentsReviewed || actionLoading}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              title={
                !allDocumentsReviewed ? "Please review all documents first" : ""
              }
            >
              Approve Business
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowRejectModal(true)}
              disabled={!allDocumentsReviewed || actionLoading}
              className="disabled:opacity-50 disabled:cursor-not-allowed"
              title={
                !allDocumentsReviewed ? "Please review all documents first" : ""
              }
            >
              Reject Application
            </Button>
          </div>

          {!allDocumentsReviewed && (
            <p className="text-sm text-yellow-600 mt-2">
              All documents must be reviewed (approved or rejected) before
              completing verification.
            </p>
          )}
        </Card>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 transition-opacity duration-300">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4 relative transform transition-all duration-300 ease-in-out scale-100">
            {/* Close Button */}
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors duration-200"
              onClick={() => {
                setShowRejectModal(false);
                setRejectionReason("");
              }}
              aria-label="Close modal"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Title with Icon */}
            <h3
              className="text-xl font-semibold mb-6 flex items-center text-gray-900"
              id="reject-modal-title"
            >
              <svg
                className="w-6 h-6 text-red-500 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              Reject Application
            </h3>

            {/* Description */}
            <p className="text-gray-600 mb-4 text-sm">
              Please provide a detailed reason for rejecting this application.
              This will help the business understand what needs to be improved.
            </p>

            {/* Textarea */}
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter reason for rejection..."
              className="w-full p-4 border border-gray-300 rounded-lg resize-none h-32 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 text-gray-900 placeholder-gray-500"
              aria-describedby="reject-reason-help"
            />
            <p id="reject-reason-help" className="text-xs text-gray-500 mt-1">
              Minimum 10 characters required
            </p>

            {/* Buttons */}
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason("");
                }}
                className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  onCompleteVerification("rejected", rejectionReason);
                  setShowRejectModal(false);
                  setRejectionReason("");
                }}
                disabled={
                  !rejectionReason.trim() || rejectionReason.trim().length < 10
                }
                className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200"
              >
                Reject Application
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
                  setResubmissionNotes("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  onCompleteVerification("repass", "", resubmissionNotes);
                  setShowRepassModal(false);
                  setResubmissionNotes("");
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
