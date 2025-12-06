import React from "react";
import { api } from "../../../lib/api";
import SectionHeader from "../../../components/layout/SectionHeader";
import Input from "../../../components/common/Input";
import Loader from "../../../components/common/Loader";
import PasswordInput from "../../../components/common/PasswordInput";
import LocationSelector from "./LocationSelector";
import DocumentUploadSection from "./DocumentUploadSection";

export default function GetStartedForm({
  hook,
  isOtpVerified,
  onOpenTerms,
  onOpenPrivacy,
}) {
  const { step, form, errors, loading, inputRef, handleChange } = hook;

  // Renders existing uploaded docs if user has a business and token
  function ExistingDocumentsNotice() {
    const [existing, setExisting] = React.useState([]);
    const [verification, setVerification] = React.useState(null);
    React.useEffect(() => {
      const token = sessionStorage.getItem("auth_token");
      let businessId = null;
      try {
        const storedUser = JSON.parse(sessionStorage.getItem("user") || "null");
        businessId = storedUser?.businessId || storedUser?.business_id || null;
      } catch {}
      if (!token || !businessId) return;
      (async () => {
        try {
          const data = await api(`/documents/business/${businessId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setExisting(Array.isArray(data.documents) ? data.documents : []);
          setVerification(data.verification || null);
        } catch {}
      })();
    }, []);

    if (!existing || existing.length === 0) return null;
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-800 mb-2">
          Previously Uploaded
        </h4>
        <ul className="space-y-2 text-sm">
          {existing.map((d) => (
            <li key={d.document_id} className="flex justify-between">
              <span className="text-gray-700">
                {d.document_type} — {d.document_name}
              </span>
              <span className="text-gray-500">
                {(d.mime_type || "").split("/").pop()}
              </span>
            </li>
          ))}
        </ul>
        {verification?.verification_status && (
          <p className="text-xs text-gray-600 mt-2">
            Verification status: {verification.verification_status}
          </p>
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
                First Name
              </label>
              <Input
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                placeholder="Enter your first name"
                type="text"
                error={errors.firstName}
              />
            </div>

            <div>
              <label className="block mb-1 text-sm text-gray-700 font-medium">
                Last Name
              </label>
              <Input
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                placeholder="Enter your last name"
                type="text"
                error={errors.fullName}
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
                placeholder="Choose a username"
                type="text"
                error={errors.username}
                helpText="3-20 characters, letters, numbers, and underscores only"
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
                maxLength={11}
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

              {/* Password Requirements Checklist */}
              <div className="mt-2 space-y-1">
                <div className="text-xs text-gray-600 mb-2">
                  Password must contain:
                </div>
                <div className="grid grid-cols-1 gap-1 text-xs">
                  <div
                    className={`flex items-center ${
                      form.password.length >= 12
                        ? "text-green-600"
                        : "text-gray-500"
                    }`}
                  >
                    <span
                      className={`mr-2 ${
                        form.password.length >= 12 ? "✓" : "○"
                      }`}
                    ></span>
                    At least 12 characters
                  </div>
                  <div
                    className={`flex items-center ${
                      /[A-Z]/.test(form.password)
                        ? "text-green-600"
                        : "text-gray-500"
                    }`}
                  >
                    <span
                      className={`mr-2 ${
                        /[A-Z]/.test(form.password) ? "✓" : "○"
                      }`}
                    ></span>
                    One uppercase letter (A-Z)
                  </div>
                  <div
                    className={`flex items-center ${
                      /[a-z]/.test(form.password)
                        ? "text-green-600"
                        : "text-gray-500"
                    }`}
                  >
                    <span
                      className={`mr-2 ${
                        /[a-z]/.test(form.password) ? "✓" : "○"
                      }`}
                    ></span>
                    One lowercase letter (a-z)
                  </div>
                  <div
                    className={`flex items-center ${
                      /\d/.test(form.password)
                        ? "text-green-600"
                        : "text-gray-500"
                    }`}
                  >
                    <span
                      className={`mr-2 ${/\d/.test(form.password) ? "✓" : "○"}`}
                    ></span>
                    One number (0-9)
                  </div>
                  <div
                    className={`flex items-center ${
                      /[!@#$%^&*(),.?":{}|<>]/.test(form.password)
                        ? "text-green-600"
                        : "text-gray-500"
                    }`}
                  >
                    <span
                      className={`mr-2 ${
                        /[!@#$%^&*(),.?":{}|<>]/.test(form.password) ? "✓" : "○"
                      }`}
                    ></span>
                    One special character (!@#$%^&*(),.?":{}|{"<"}
                    {">"})
                  </div>
                </div>
              </div>
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
          <div className="text-xs text-gray-600 text-center">
            By continuing, you agree to our{" "}
            <button
              type="button"
              onClick={onOpenTerms}
              className="text-blue-700 underline hover:text-blue-800"
            >
              Terms & Conditions
            </button>{" "}
            and{" "}
            <button
              type="button"
              onClick={onOpenPrivacy}
              className="text-blue-700 underline hover:text-blue-800"
            >
              Privacy Policy
            </button>
            .
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
              onChange={(e) => {
                const value = e.target.value.slice(0, 4);
                handleChange({ target: { name: "otp", value } });
                if (errors.otp) hook.setErrors({ ...errors, otp: null });
              }}
              placeholder="Enter 4-character code"
              type="text"
              maxLength={4}
              error={errors.otp}
              disabled={isOtpVerified}
            />
            {form.otp.length === 4 && !isOtpVerified && !loading && (
              <div className="mt-2 text-blue-600 text-sm font-medium flex items-center">
                <Loader size="sm" className="mr-2" />
                Auto-verifying OTP...
              </div>
            )}
            {loading && (
              <div className="mt-2 text-gray-700 text-sm font-medium flex items-center">
                <Loader size="sm" className="mr-2" />
                Verifying OTP...
              </div>
            )}
            {isOtpVerified && (
              <div className="mt-2 text-green-600 text-sm font-medium flex items-center">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="currentColor"
                  viewBox="0 20 20"
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
                  await api("/otp/resend", {
                    method: "POST",
                    body: JSON.stringify({ email: form.email }),
                  });
                  alert("New OTP sent successfully!");
                } catch (err) {
                  alert("Failed to resend OTP");
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
                  <label
                    htmlFor="useAdminEmail"
                    className="text-sm text-gray-700"
                  >
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
                style={{ borderColor: errors.businessType ? "#ef4444" : "" }}
              >
                <option value="">Select business type</option>
                <option value="Grocery Store">Grocery Store</option>
                <option value="Pharmacy">Pharmacy</option>
                <option value="Clothing Store">Clothing Store</option>
                <option value="Electronics Store">Electronics Store</option>
                <option value="Hardware Store">Hardware Store</option>
                <option value="Bookstore">Bookstore</option>
                <option value="Convenience Store">Convenience Store</option>
                <option value="Others">Others</option>
              </select>
              {errors.businessType && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.businessType}
                </p>
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
              <LocationSelector
                form={form}
                errors={errors}
                handleLocationChange={hook.handleLocationChange}
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
            Please upload your business documents for verification. These
            documents help us verify that your business is legitimate and
            complies with Philippine regulations.
          </p>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-red-800 mb-2">
              ⚠️ REQUIRED Documents (Must Upload All 3):
            </h4>
            <ul className="text-sm text-red-700 space-y-1 font-medium">
              <li>► Business Registration Certificate (DTI/SEC/CDA)</li>
              <li>► Mayor's Permit / Business Permit</li>
              <li>► BIR Certificate of Registration (Form 2303)</li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-blue-800 mb-2">
              Additional Documents (Optional):
            </h4>
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
                handleChange({
                  target: { name: "documents", value: documents },
                });
                handleChange({
                  target: { name: "documentTypes", value: types },
                });
              }}
              error={errors.documents || errors.documentTypes}
            />

            {/* Existing uploaded files (if resuming) */}
            <ExistingDocumentsNotice />
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
            <p className="text-sm text-yellow-800">
              <strong>Important:</strong> After submitting your documents,
              please allow 1-3 business days for verification. You will receive
              an email notification once the review is complete.
            </p>
          </div>

          <div className="mt-6 space-y-4">
            {/* Terms and Conditions Checkbox */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="acceptTerms"
                  name="acceptTerms"
                  type="checkbox"
                  checked={form.acceptTerms}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="acceptTerms" className="text-gray-700">
                  I agree to the{' '}
                  <button
                    type="button"
                    onClick={onOpenTerms}
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    Terms and Conditions
                  </button>
                </label>
              </div>
            </div>

            {/* Privacy Policy Checkbox */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="acceptPrivacy"
                  name="acceptPrivacy"
                  type="checkbox"
                  checked={form.acceptPrivacy}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="acceptPrivacy" className="text-gray-700">
                  I have read the{' '}
                  <button
                    type="button"
                    onClick={onOpenPrivacy}
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    Privacy Policy
                  </button>
                </label>
              </div>
            </div>

            {errors.accept && (
              <p className="mt-2 text-sm text-red-600">{errors.accept}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex justify-between items-center pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={hook.handlePrevious}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <button
              type="button"
              onClick={hook.handleFinish}
              disabled={loading || !form.documents || form.documents.length === 0 || 
                !form.acceptTerms || !form.acceptPrivacy ||
                // Check if all required documents are uploaded and have types
                !['Business Registration Certificate (DTI/SEC/CDA)', 
                  "Mayor's Permit / Business Permit", 
                  'BIR Certificate of Registration (Form 2303)']
                  .every(reqType => form.documentTypes?.includes(reqType)) ||
                // Check if all uploaded documents have a type selected
                form.documentTypes?.some(type => !type)
              }
              className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </>
              ) : (
                'Submit Application'
              )}
            </button>
          </div>

        </div>
      );

    default:
      return null;
  }
}
