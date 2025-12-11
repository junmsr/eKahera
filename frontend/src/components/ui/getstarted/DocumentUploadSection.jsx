import React, { useState } from "react";

export default function DocumentUploadSection({
  documents,
  documentTypes,
  onDocumentsChange,
  error,
}) {
  const [uploadErrors, setUploadErrors] = useState([]);

  const requiredDocuments = [
    "Business Registration Certificate (DTI/SEC/CDA)",
    "Mayor's Permit / Business Permit",
    "BIR Certificate of Registration (Form 2303)",
  ];

  const optionalDocuments = [
    "Barangay Business Clearance",
    "Fire Safety Inspection Certificate (if applicable)",
    "Sanitary Permit (for food businesses)",
  ];

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];

    const maxSizeBytes = 10 * 1024 * 1024; // 10MB

    // Prevent duplicates by name+size+lastModified
    const existingKey = (f) => `${f.name}|${f.size}|${f.lastModified || ""}`;
    const existingKeys = new Set(documents.map(existingKey));

    const accepted = [];
    const rejected = [];

    files.forEach((file) => {
      const key = existingKey(file);
      if (existingKeys.has(key)) {
        rejected.push({ file, reason: "Duplicate file" });
        return;
      }
      if (!allowedTypes.includes(file.type)) {
        rejected.push({
          file,
          reason: "Unsupported file type. Only PDF, JPG, PNG allowed.",
        });
        return;
      }
      if (file.size > maxSizeBytes) {
        rejected.push({
          file,
          reason: "File too large. Maximum 10MB per file.",
        });
        return;
      }
      // Basic security check: ensure file is not empty and has valid extension
      const ext = file.name.split(".").pop()?.toLowerCase();
      const validExts = ["pdf", "jpg", "jpeg", "png"];
      if (!validExts.includes(ext)) {
        rejected.push({ file, reason: "Invalid file extension." });
        return;
      }
      accepted.push(file);
      existingKeys.add(key);
    });

    if (accepted.length > 0) {
      const newDocuments = [...documents, ...accepted];
      const newTypes = [...documentTypes, ...accepted.map(() => "")];
      onDocumentsChange(newDocuments, newTypes);
      setUploadErrors([]); // Clear previous errors on success
    }

    if (rejected.length > 0) {
      setUploadErrors(
        rejected.map(({ file, reason }) => `${file.name}: ${reason}`)
      );
    }

    // Reset the input
    e.target.value = "";
  };

  const handleTypeChange = (index, type) => {
    const newTypes = [...documentTypes];
    newTypes[index] = type;
    onDocumentsChange(documents, newTypes);
  };

  const removeDocument = (index) => {
    const newDocuments = documents.filter((_, i) => i !== index);
    const newTypes = documentTypes.filter((_, i) => i !== index);
    onDocumentsChange(newDocuments, newTypes);
  };

  const documentTypeOptions = [
    ...requiredDocuments,
    ...optionalDocuments,
    "Other Business Document",
  ];

  // Check if required documents are uploaded and have types selected
  const uploadedTypes = documentTypes.filter(
    (type, index) => type && documents[index]
  );
  const missingRequired = requiredDocuments.filter(
    (req) => !uploadedTypes.includes(req)
  );

  // Check if any uploaded document is missing a type
  const hasUntypedDocuments =
    documents.length > 0 &&
    (documentTypes.length < documents.length ||
      documentTypes.some((type) => !type));

  // Check if all required documents are present with types
  const allRequiredPresent = requiredDocuments.every((req) =>
    documentTypes.some((type, index) => type === req && documents[index])
  );

  return (
    <div className="space-y-4">
      <div>
        <label className="block mb-2 text-sm text-gray-700 font-medium">
          Upload Business Documents <span className="text-red-500">*</span>
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-4"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className="text-gray-600 mb-2">
            Drag and drop files here, or click to browse
          </p>
          <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            <svg
              className="w-4 h-4 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
            Browse Files
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Accepted formats: PDF, JPG, PNG. Maximum file size: 10MB per file.
          Secure uploads only.
        </p>
      </div>

      {uploadErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-semibold text-red-800 mb-2">Upload Errors:</h4>
          <ul className="text-sm text-red-700 space-y-1">
            {uploadErrors.map((err, idx) => (
              <li key={idx}>• {err}</li>
            ))}
          </ul>
        </div>
      )}

      {documents.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Uploaded Documents:</h4>
          {documents.map((file, index) => {
            const isRequired = requiredDocuments.includes(documentTypes[index]);
            const isOptional = optionalDocuments.includes(documentTypes[index]);
            return (
              <div
                key={index}
                className={`flex items-center space-x-3 p-3 rounded-lg border ${
                  isRequired
                    ? "bg-green-50 border-green-200"
                    : isOptional
                    ? "bg-blue-50 border-blue-200"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <div className="flex-shrink-0">
                  {file.type === "application/pdf" ? (
                    <svg
                      className="w-8 h-8 text-red-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-8 h-8 text-blue-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB •{" "}
                    {file.type || "unknown"}
                  </p>
                  {isRequired && (
                    <span className="inline-block mt-1 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                      Required
                    </span>
                  )}
                  {isOptional && (
                    <span className="inline-block mt-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                      Optional
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <select
                    value={documentTypes[index] || ""}
                    onChange={(e) => handleTypeChange(index, e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select document type</option>
                    {documentTypeOptions.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => removeDocument(index)}
                  className="text-red-600 hover:text-red-800 text-sm p-1"
                  title="Remove document"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {missingRequired.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold text-green-800 mb-2">
            Required Documents:
          </h4>
          <ul className="text-sm text-green-700 space-y-1">
            {missingRequired.map((doc, idx) => (
              <li key={idx} className="flex items-center">
                <span className="mr-2">•</span>
                <span className="flex-1">{doc}</span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                  Required
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {hasUntypedDocuments && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
          <h4 className="font-semibold text-red-800 mb-2">Action Required:</h4>
          <p className="text-sm text-red-700">
            Please select a document type for all uploaded files.
          </p>
        </div>
      )}

      {allRequiredPresent && !hasUntypedDocuments && documents.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
          <div className="flex items-center text-green-800">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="font-medium">
              All required documents are uploaded and typed.
            </span>
          </div>
        </div>
      )}

      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}
