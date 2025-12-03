import React, { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import Button from "../components/common/Button";
import Loader from "../components/common/Loader";
import { toast } from "react-toastify";

const DocumentResubmitPage = () => {
  const { documentId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const token = sessionStorage.getItem('auth_token');
    const storedUser = sessionStorage.getItem('user');
    
    if (token && storedUser) {
      setIsAuthenticated(true);
      const user = JSON.parse(storedUser);
      setUserEmail(user.email || '');
    } else {
      // If not logged in, use email from URL if provided
      const email = searchParams.get('email');
      if (email) {
        setUserEmail(email);
      } else {
        // If no email in URL and not logged in, redirect to login
        navigate('/login', { state: { from: window.location.pathname } });
        return;
      }
    }

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
  }, [documentId, searchParams]);

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
    
    // Only add user_email if user is not authenticated
    if (!isAuthenticated && userEmail) {
      formData.append('user_email', userEmail);
    }

    try {
      setIsSubmitting(true);
      setError("");
      
      const token = sessionStorage.getItem('auth_token');
      const headers = {
        'Accept': 'application/json',
      };
      
      // Add authorization header if user is authenticated
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${process.env.REACT_APP_API_URL || ''}/api/documents/resubmit`, {
        method: 'POST',
        body: formData,
        headers: headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resubmit document');
      }

      toast.success("Document resubmitted successfully!");
      setSuccess("Document resubmitted successfully!");
      setFile(null);
      document.verification_status = 'pending';
      document.verification_notes = null;
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
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
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Document Resubmission</h1>
          <p className="mt-2 text-sm text-gray-600">
            {document ? `Please upload a new version of your ${document.document_type}` : "Document Resubmission"}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
            <p>{error}</p>
          </div>
        )}

        {success ? (
          <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-500 text-green-700">
            <p>{success}</p>
            <p className="mt-2">You will be redirected to the login page shortly...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {!userEmail && (
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Your Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="your.email@example.com"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Document: {document?.document_type}
              </label>
              <p className="text-sm text-gray-500 mb-4">
                Status: <span className="font-medium text-red-600">Rejected</span>
                {document?.verification_notes && (
                  <span className="block mt-1 text-sm text-gray-600">
                    <span className="font-medium">Note:</span> {document.verification_notes}
                  </span>
                )}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload New Version
              </label>
              <div className="mt-1 flex items-center">
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                  required
                />
              </div>
              {file && (
                <p className="mt-2 text-sm text-green-600">
                  Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Accepted formats: .pdf, .jpg, .jpeg, .png (Max: 5MB)
              </p>
            </div>

            <div className="pt-4 space-y-3">
              <Button
                type="submit"
                disabled={!file || isSubmitting || !userEmail}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Uploading...' : 'Resubmit Document'}
              </Button>
              
              <Button
                type="button"
                onClick={() => navigate('/login')}
                variant="outline"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Back to Login
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default DocumentResubmitPage;