import React from "react";
import SectionHeader from "../../../components/layout/SectionHeader";
import Input from "../../../components/common/Input";
import Button from "../../../components/common/Button";
import Loader from "../../../components/common/Loader";
import PasswordInput from "../../../components/common/PasswordInput";

export default function GetStartedForm({ hook }) {
  const {
    step,
    steps,
    form,
    errors,
    loading,
    otpVerified,
    inputRef,
    handleChange,
  } = hook;

  // Renders existing uploaded docs if user has a business and token
  function ExistingDocumentsNotice() {
    const [existing, setExisting] = React.useState([]);
    const [verification, setVerification] = React.useState(null);
    React.useEffect(() => {
      const token = localStorage.getItem('token');
      let businessId = null;
      try {
        const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
        businessId = storedUser?.businessId || storedUser?.business_id || null;
      } catch {}
      if (!token || !businessId) return;
      (async () => {
        try {
          const resp = await fetch(`http://localhost:5000/api/documents/business/${businessId}`, {
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
          });
          if (resp.ok) {
            const data = await resp.json();
            setExisting(Array.isArray(data.documents) ? data.documents : []);
            setVerification(data.verification || null);
          }
        } catch {}
      })();
    }, []);

    if (!existing || existing.length === 0) return null;
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-800 mb-2">Previously Uploaded</h4>
        <ul className="space-y-2 text-sm">
          {existing.map((d) => (
            <li key={d.document_id} className="flex justify-between">
              <span className="text-gray-700">{d.document_type} — {d.document_name}</span>
              <span className="text-gray-500">{(d.mime_type || '').split('/').pop()}</span>
            </li>
          ))}
        </ul>
        {verification?.verification_status && (
          <p className="text-xs text-gray-600 mt-2">Verification status: {verification.verification_status}</p>
        )}
      </div>
    );
  }

  switch (step) {
    case 0:
      return (
        <div className="space-y-4">
          <SectionHeader className="text-2xl md:text-3xl text-gray-900">
            Account Info
          </SectionHeader>
          <div className="grid gap-4">
            <div>
              <label className="block mb-1 text-sm text-gray-700 font-medium">
                Email
              </label>
              <Input
                ref={inputRef}
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter your email address"
                type="email"
                error={errors.email}
              />
            </div>

            <div>
              <label className="block mb-1 text-sm text-gray-700 font-medium">
                Username
              </label>
              <Input
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="Choose a username (3-20 characters)"
                type="text"
                error={errors.username}
              />
            </div>

            <div>
              <label className="block mb-1 text-sm text-gray-700 font-medium">
                Mobile Number
              </label>
              <Input
                name="mobile"
                value={form.mobile}
                onChange={handleChange}
                placeholder="09xxxxxxxxx"
                type="tel"
                maxLength={15}
                error={errors.mobile}
              />
            </div>

            <div>
              <label className="block mb-1 text-sm text-gray-700 font-medium">
                Password
              </label>
              <PasswordInput
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter password"
                error={errors.password}
              />
            </div>

            <div>
              <label className="block mb-1 text-sm text-gray-700 font-medium">
                Password Confirmation
              </label>
              <PasswordInput
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter password"
                error={errors.confirmPassword}
              />
            </div>
          </div>
        </div>
      );

    case 1:
      return (
        <div className="space-y-4">
          <SectionHeader className="text-2xl md:text-3xl text-gray-900">
            OTP Verification
          </SectionHeader>
          <p className="text-gray-700 mb-2 text-sm">
            We've sent a 4-character verification code to{" "}
            <strong>{form.email}</strong>.
          </p>

          <div>
            <label className="block mb-1 text-sm text-gray-700 font-medium">
              Enter OTP
            </label>
            <Input
              ref={inputRef}
              name="otp"
              value={form.otp}
              onChange={async (e) => {
                const value = e.target.value.slice(0, 4);
                handleChange({ target: { name: "otp", value } });

                if (errors.otp) hook.setErrors({ ...errors, otp: null });

                if (value.length === 4) {
                  hook.setLoading(true);
                  try {
                    const otpResponse = await fetch(
                      "http://localhost:5000/api/otp/verify",
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email: form.email, otp: value }),
                      }
                    );
                    if (otpResponse.ok) {
                      hook.setOtpVerified(true);
                      setTimeout(() => {
                        hook.setStep((s) => s + 1);
                        hook.setOtpVerified(false);
                      }, 800);
                    } else {
                      const error = await otpResponse.json();
                      hook.setErrors({
                        otp: error.error || "OTP verification failed",
                      });
                    }
                  } catch {
                    hook.setErrors({ otp: "Network error. Please try again." });
                  } finally {
                    hook.setLoading(false);
                  }
                }
              }}
              placeholder="Enter 4-character code (auto-verifies)"
              type="text"
              maxLength={4}
              error={errors.otp}
            />
            {loading && form.otp.length === 4 && (
              <div className="mt-2 text-gray-700 text-sm font-medium flex items-center">
                <Loader size="sm" className="mr-2" />
                Verifying OTP...
              </div>
            )}
            {otpVerified && (
              <div className="mt-2 text-green-600 text-sm font-medium flex items-center">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                OTP verified successfully!
              </div>
            )}
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={async () => {
                hook.setLoading(true);
                try {
                  const response = await fetch(
                    "http://localhost:5000/api/otp/resend",
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email: form.email }),
                    }
                  );
                  if (response.ok) alert("New OTP sent successfully!");
                  else {
                    const error = await response.json();
                    alert(error.error || "Failed to resend OTP");
                  }
                } catch {
                  alert("Network error. Please try again.");
                } finally {
                  hook.setLoading(false);
                }
              }}
              className="text-gray-700 hover:text-gray-900 text-sm underline"
              disabled={loading}
            >
              {loading ? "Sending..." : "Resend OTP"}
            </button>
          </div>
        </div>
      );

    case 2:
      return (
        <div className="space-y-4">
          <SectionHeader className="text-2xl md:text-3xl text-gray-900">
            Business Details
          </SectionHeader>

          <div className="grid gap-4">
            <div>
              <label className="block mb-1 text-sm text-gray-700 font-medium">
                Business Name <span className="text-red-500">*</span>
              </label>
              <Input
                name="businessName"
                value={form.businessName}
                onChange={handleChange}
                placeholder="Enter business name"
                error={errors.businessName}
              />
            </div>

            <div>
              <label className="block mb-1 text-sm text-gray-700 font-medium">
                Business Email <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="useAdminEmail"
                    name="useAdminEmail"
                    checked={form.useAdminEmail}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="useAdminEmail" className="text-sm text-gray-700">
                    Use admin email ({form.email})
                  </label>
                </div>
                {!form.useAdminEmail && (
                  <Input
                    name="businessEmail"
                    value={form.businessEmail}
                    onChange={handleChange}
                    placeholder="Enter business email"
                    type="email"
                    error={errors.businessEmail}
                  />
                )}
              </div>
            </div>

            <div>
              <label className="block mb-1 text-sm text-gray-700 font-medium">
                Business Type <span className="text-red-500">*</span>
              </label>
              <select
                name="businessType"
                value={form.businessType}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                style={{ borderColor: errors.businessType ? '#ef4444' : '' }}
              >
                <option value="">Select business type</option>
                <option value="Retail">Retail</option>
                <option value="Restaurant">Restaurant</option>
                <option value="Grocery Store">Grocery Store</option>
                <option value="Pharmacy">Pharmacy</option>
                <option value="Clothing Store">Clothing Store</option>
                <option value="Electronics Store">Electronics Store</option>
                <option value="Hardware Store">Hardware Store</option>
                <option value="Beauty Salon">Beauty Salon</option>
                <option value="Bakery">Bakery</option>
                <option value="Bookstore">Bookstore</option>
                <option value="Pet Store">Pet Store</option>
                <option value="Convenience Store">Convenience Store</option>
                <option value="Services">Services</option>
                <option value="Others">Others</option>
              </select>
              {errors.businessType && (
                <p className="text-red-500 text-sm mt-1">{errors.businessType}</p>
              )}
              {form.businessType === "Others" && (
                <div className="mt-2">
                  <Input
                    name="customBusinessType"
                    value={form.customBusinessType}
                    onChange={handleChange}
                    placeholder="Please specify your business type"
                    error={errors.customBusinessType}
                  />
                </div>
              )}
            </div>

            <div>
              <div className="mb-2 mt-4 font-semibold text-gray-900">
                Business Location
              </div>
              <label className="block mb-1 text-sm text-gray-700 font-medium">
                Country <span className="text-red-500">*</span>
              </label>
              <Input
                name="country"
                value={form.country}
                onChange={handleChange}
                placeholder="Enter country"
                error={errors.country}
              />
            </div>

            <div>
              <label className="block mb-1 text-sm text-gray-700 font-medium">
                Business Address <span className="text-red-500">*</span>
              </label>
              <Input
                name="businessAddress"
                value={form.businessAddress}
                onChange={handleChange}
                placeholder="Enter business address"
                error={errors.businessAddress}
              />
            </div>

            <div>
              <label className="block mb-1 text-sm text-gray-700 font-medium">
                House no./ Street Name / Landmark (optional)
              </label>
              <Input
                name="houseNumber"
                value={form.houseNumber}
                onChange={handleChange}
                placeholder="Enter house no., street, or landmark (optional)"
              />
            </div>
          </div>
        </div>
      );

    case 3:
      return (
        <div className="space-y-4">
          <SectionHeader className="text-2xl md:text-3xl text-gray-900">
            Business Documents
          </SectionHeader>
          <p className="text-gray-700 mb-4 text-sm">
            Please upload your business documents for verification. These documents help us verify that your business is legitimate and complies with Philippine regulations.
          </p>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-red-800 mb-2">⚠️ REQUIRED Documents (Must Upload All 3):</h4>
            <ul className="text-sm text-red-700 space-y-1 font-medium">
              <li>✅ Business Registration Certificate (DTI/SEC/CDA)</li>
              <li>✅ Mayor's Permit / Business Permit</li>
              <li>✅ BIR Certificate of Registration (Form 2303)</li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-blue-800 mb-2">Additional Documents (Optional):</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Barangay Business Clearance</li>
              <li>• Fire Safety Inspection Certificate (if applicable)</li>
              <li>• Sanitary Permit (for food businesses)</li>
            </ul>
          </div>

          <div className="space-y-4">
            <DocumentUploadSection 
              documents={form.documents}
              documentTypes={form.documentTypes}
              onDocumentsChange={(documents, types) => {
                handleChange({ target: { name: 'documents', value: documents } });
                handleChange({ target: { name: 'documentTypes', value: types } });
              }}
              error={errors.documents || errors.documentTypes}
            />

            {/* Existing uploaded files (if resuming) */}
            <ExistingDocumentsNotice />
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
            <p className="text-sm text-yellow-800">
              <strong>Important:</strong> After submitting your documents, please allow 1-3 business days for verification. 
              You will receive an email notification once the review is complete.
            </p>
          </div>
        </div>
      );

    default:
      return null;
  }
}

// Document Upload Component
function DocumentUploadSection({ documents, documentTypes, onDocumentsChange, error }) {
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
