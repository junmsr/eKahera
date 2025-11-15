import React from "react";

export default function DocumentUploadSection({ documents, documentTypes, onDocumentsChange, error }) {
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif'
    ];

    const maxSizeBytes = 10 * 1024 * 1024; // 10MB

    // Prevent duplicates by name+size+lastModified
    const existingKey = (f) => `${f.name}|${f.size}|${f.lastModified || ''}`;
    const existingKeys = new Set(documents.map(existingKey));

    const accepted = [];
    const rejected = [];

    files.forEach((file) => {
      const key = existingKey(file);
      if (existingKeys.has(key)) {
        rejected.push({ file, reason: 'Duplicate file' });
        return;
      }
      if (!allowedTypes.includes(file.type)) {
        rejected.push({ file, reason: 'Unsupported type' });
        return;
      }
      if (file.size > maxSizeBytes) {
        rejected.push({ file, reason: 'File too large (>10MB)' });
        return;
      }
      accepted.push(file);
      existingKeys.add(key);
    });

    if (accepted.length > 0) {
      const newDocuments = [...documents, ...accepted];
      const newTypes = [...documentTypes, ...accepted.map(() => '')];
      onDocumentsChange(newDocuments, newTypes);
    }

    if (rejected.length > 0) {
      const reasons = rejected
        .map(({ file, reason }) => `${file.name}: ${reason}`)
        .join(', ');
      // eslint-disable-next-line no-alert
      alert(`Some files were not added — ${reasons}`);
    }
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
    'Business Registration Certificate',
    'Mayor\'s Permit',
    'BIR Certificate of Registration',
    'Barangay Business Clearance',
    'Fire Safety Inspection Certificate',
    'Sanitary Permit',
    'Other Business Document'
  ];

  return (
    <div className="space-y-4">
      <div>
        <label className="block mb-2 text-sm text-gray-700 font-medium">
          Upload Business Documents <span className="text-red-500">*</span>
        </label>
        <input
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.gif"
          onChange={handleFileChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          Accepted formats: PDF, JPG, PNG, GIF. Maximum file size: 10MB per file.
        </p>
      </div>

      {documents.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Uploaded Documents:</h4>
          {documents.map((file, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB • {(file.type || 'unknown')}
                  {file.name?.includes('.') ? ` • .${file.name.split('.').pop()?.toLowerCase()}` : ''}
                </p>
              </div>
              <div className="flex-1">
                <select
                  value={documentTypes[index] || ''}
                  onChange={(e) => handleTypeChange(index, e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select document type</option>
                  {documentTypeOptions.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => removeDocument(index)}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  );
}
