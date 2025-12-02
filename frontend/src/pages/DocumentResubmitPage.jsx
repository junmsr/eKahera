import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import Button from "../components/common/Button";
import Loader from "../components/common/Loader";

/**
 * Document Resubmission Page
 * Allows users to resubmit a single rejected document without authentication
 */
const DocumentResubmitPage = () => {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        setLoading(true);
        const data = await api(`/documents/${documentId}/info`);
        
        if (data.verification_status !== 'rejected') {
          setError("This document is not marked as rejected and cannot be resubmitted.");
        } else {
          setDocument(data);
        }
      } catch (err) {
        console.error("Failed to fetch document:", err);
        setError("Failed to load document. Please check the link and try again.");
      } finally {
        setLoading(false);
      }
    };

    if (documentId) {
      fetchDocument();
    } else {
      setError("No document ID provided");
      setLoading(false);
    }
  }, [documentId]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError("Please select a file to upload");
      return;
    }

    const formData = new FormData();
    formData.append('document', file);
    formData.append('document_id', documentId);

    try {
      setIsSubmitting(true);
      setError("");
      
      const response = await fetch(`${process.env.REACT_APP_API_URL || ''}/api/documents/resubmit`, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header, let the browser set it with the correct boundary
        headers: {
          'Accept': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resubmit document');
      }

      setSuccess("Document resubmitted successfully!");
      setFile(null);
      document.verification_status = 'pending';
      document.verification_notes = null;
      
    } catch (error) {
      console.error("Resubmission error:", error);
      setError(error.message || "Failed to resubmit document. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader size="lg" />
          <p className="mt-4 text-gray-600">Loading document information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Resubmit Document</h1>
          <p className="text-gray-600 mt-2">
            {document ? `Please upload a new version of your ${document.document_type}` : "Document Resubmission"}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            </div>
          </div>
        )}

        {document && (
          <div className="mb-6">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900">{document.document_type}</h3>
              <p className="text-sm text-gray-500">{document.document_name}</p>
            </div>

            {document.verification_notes && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      <strong>Rejection Reason:</strong> {document.verification_notes}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload new version
                </label>
                <div className="mt-1 flex items-center">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100"
                    accept=".pdf,.jpg,.jpeg,.png"
                    disabled={isSubmitting || success}
                  />
                </div>
                {file && (
                  <p className="mt-2 text-sm text-gray-600">
                    Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.history.back()}
                  disabled={isSubmitting}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={!file || isSubmitting || success}
                  loading={isSubmitting}
                >
                  {isSubmitting ? 'Uploading...' : 'Resubmit Document'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {success && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              Your document has been resubmitted for review. You can close this page.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentResubmitPage;
