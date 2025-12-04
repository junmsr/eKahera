import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import Button from "../components/common/Button";
import Loader from "../components/common/Loader";
import { toast } from "react-toastify";

const PublicDocumentResubmit = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [selectedFiles, setSelectedFiles] = useState({});
  const [isSubmitting, setIsSubmitting] = useState({});
  const [emailVerified, setEmailVerified] = useState(false);
  const [showVerificationForm, setShowVerificationForm] = useState(true);

  // Check for email in URL params
  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
      // Auto-verify if email is in URL
      handleVerifyEmail({ preventDefault: () => {} }, emailParam);
    }
  }, [searchParams]);

  const handleVerifyEmail = async (e, emailToVerify = null) => {
    e?.preventDefault();
    const emailValue = emailToVerify || email;
    
    if (!emailValue) {
      setError("Please enter your email address");
      return;
    }

    try {
      setVerifying(true);
      setError("");
      
      // Call API to verify email and get rejected documents
      const data = await api(`/documents/rejected?email=${encodeURIComponent(emailValue)}`);
      
      if (!data.documents || data.documents.length === 0) {
        setError("No rejected documents found for this email address.");
        return;
      }
      
      setDocuments(data.documents);
      setEmailVerified(true);
      setShowVerificationForm(false);
      
      // Update URL with email parameter
      const newUrl = new URL(window.location);
      newUrl.searchParams.set('email', emailValue);
      window.history.pushState({}, '', newUrl);
      
    } catch (err) {
      console.error("Verification error:", err);
      setError(err.response?.data?.error || "Failed to verify email. Please try again.");
    } finally {
      setVerifying(false);
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
    formData.append('user_email', email);

    try {
      setIsSubmitting(prev => ({ ...prev, [documentId]: true }));
      
      await api(`/documents/resubmit`, {
        method: 'POST',
        body: formData,
      });

      // Update the document status in the local state
      setDocuments(prev => 
        prev.map(doc => 
          doc.document_id === documentId 
            ? { ...doc, verification_status: 'pending', verification_notes: '' } 
            : doc
        )
      );
      
      // Clear the selected file
      setSelectedFiles(prev => {
        const newFiles = { ...prev };
        delete newFiles[documentId];
        return newFiles;
      });
      
      toast.success("Document resubmitted successfully!");
      
    } catch (error) {
      console.error("Failed to resubmit document:", error);
      setError(error.response?.data?.error || "Failed to resubmit document. Please try again.");
    } finally {
      setIsSubmitting(prev => ({ ...prev, [documentId]: false }));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-yellow-600 bg-yellow-100';
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
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Document Resubmission</h1>
          <p className="mt-2 text-lg text-gray-600">
            Please verify your email to view and resubmit rejected documents
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
            <p>{error}</p>
          </div>
        )}

        {showVerificationForm && (
          <div className="bg-white shadow overflow-hidden rounded-lg p-6 mb-8">
            <h2 className="text-xl font-medium text-gray-900 mb-4">Verify Your Email</h2>
            <p className="text-gray-600 mb-6">
              Please enter the email address associated with your rejected documents.
            </p>
            
            <form onSubmit={handleVerifyEmail} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="your.email@example.com"
                  disabled={verifying}
                />
              </div>
              
              <div className="pt-2">
                <Button 
                  type="submit" 
                  disabled={verifying || !email}
                  className="w-full justify-center"
                >
                  {verifying ? 'Verifying...' : 'Continue'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {emailVerified && (
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
                      Upload New Version
                    </label>
                    <div className="flex items-center">
                      <input
                        type="file"
                        id={`file-${doc.document_id}`}
                        onChange={(e) => handleFileChange(doc.document_id, e.target.files[0])}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        accept=".pdf,.jpg,.jpeg,.png"
                      />
                      <Button
                        type="button"
                        onClick={() => handleResubmit(doc.document_id)}
                        disabled={!selectedFiles[doc.document_id] || isSubmitting[doc.document_id]}
                        className="ml-2 whitespace-nowrap"
                      >
                        {isSubmitting[doc.document_id] ? 'Uploading...' : 'Upload'}
                      </Button>
                    </div>
                    {selectedFiles[doc.document_id] && (
                      <p className="mt-2 text-sm text-gray-600">
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
    </div>
  );
};

export default PublicDocumentResubmit;
