import React from "react";
import BaseModal from "./BaseModal";

/**
 * DocumentViewerModal Component
 * Displays documents (PDFs, images) in a modal without requiring download
 */
export default function DocumentViewerModal({
  isOpen,
  onClose,
  documentUrl,
  documentName,
}) {
  if (!documentUrl) {
    return null;
  }

  // Determine if it's a PDF or image
  const isPDF = documentUrl.toLowerCase().includes(".pdf");
  const isImage = /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(documentUrl);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`View Document`}
      subtitle={documentName}
      size="full"
      icon={
        <svg
          className="w-5 h-5 text-white"
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
      }
    >
      <div className="w-full h-full min-h-[70vh]">
        {isPDF ? (
          <iframe
            src={documentUrl}
            className="w-full h-full border-0 rounded-lg"
            title={`View ${documentName}`}
            allowFullScreen
          />
        ) : isImage ? (
          <div className="flex items-center justify-center h-full">
            <img
              src={documentUrl}
              alt={documentName}
              className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
              onError={(e) => {
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "block";
              }}
            />
            <div className="hidden text-center text-gray-500">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-lg font-medium">Unable to load document</p>
              <p className="text-sm">
                The document may not be available or supported
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-lg font-medium">
                Document Preview Not Available
              </p>
              <p className="text-sm">
                This document type cannot be previewed inline
              </p>
              <a
                href={documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
                Open in New Tab
              </a>
            </div>
          </div>
        )}
      </div>
    </BaseModal>
  );
}
