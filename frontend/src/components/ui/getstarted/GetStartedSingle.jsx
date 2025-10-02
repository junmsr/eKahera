import React, { useEffect, useRef, useState } from "react";
import Background from "../../../components/layout/Background";
import Card from "../../../components/common/Card";
import Logo from "../../../components/common/Logo";
import SectionHeader from "../../../components/layout/SectionHeader";
import Input from "../../../components/common/Input";
import Button from "../../../components/common/Button";
import Loader from "../../../components/common/Loader";
import PasswordInput from "../../../components/common/PasswordInput";
import { getProvinces, getCities, getBarangays } from "../../../data/philippinesLocations";

// Inline ProgressBar
function ProgressBar({ percent }) {
  return (
    <div
      className="w-full h-3 bg-blue-100 rounded-full overflow-hidden shadow-inner"
      aria-label="Progress bar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      role="progressbar"
    >
      <div
        className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500 rounded-full shadow-md"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

// Inline Stepper
function Stepper({ steps, currentStep }) {
  return (
    <div className="flex items-center justify-center mb-10 gap-2 md:gap-4">
      {steps.map((stepObj, idx) => (
        <React.Fragment key={idx}>
          <div
            className={`w-10 h-10 flex items-center justify-center rounded-full border-2 font-bold text-lg transition-all duration-300 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 
              ${
                idx < currentStep
                  ? "bg-green-500 border-green-500 text-white"
                  : idx === currentStep
                  ? "bg-blue-600 border-blue-700 text-white ring-2 ring-blue-300"
                  : "bg-blue-100 border-gray-300 text-gray-400"
              }
            `}
            aria-current={idx === currentStep ? "step" : undefined}
            tabIndex={0}
          >
            {stepObj.icon}
          </div>
          {idx < steps.length - 1 && (
            <div className="w-8 h-1 bg-gray-300 mx-1 rounded hidden md:block" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// Document Upload Component
function DocumentUploadSection({ documents, documentTypes, onDocumentsChange, error }) {
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const newDocuments = [...documents, ...files];
    const newTypes = [...documentTypes, ...files.map(() => '')];
    onDocumentsChange(newDocuments, newTypes);
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
                <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
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

export default function GetStartedSingle() {
  const steps = [
    { label: "Account Info", icon: "👤" },
    { label: "OTP Verification", icon: "🔒" },
    { label: "Business Details", icon: "🏢" },
    { label: "Document Upload", icon: "📄" },
  ];

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    email: "",
    username: "",
    businessName: "",
    businessEmail: "",
    useAdminEmail: false,
    businessType: "",
    customBusinessType: "",
    country: "Philippines",
    province: "",
    city: "",
    barangay: "",
    houseNumber: "",
    mobile: "",
    password: "",
    confirmPassword: "",
    otp: "",
    documents: [],
    documentTypes: [],
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [emailChecking, setEmailChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [emailAvailable, setEmailAvailable] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, [step]);

  // Debounce function for API calls
  const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);
      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);
    return debouncedValue;
  };

  const debouncedUsername = useDebounce(form.username, 500);
  const debouncedEmail = useDebounce(form.email, 500);

  // Check username availability
  useEffect(() => {
    if (debouncedUsername && debouncedUsername.length >= 3) {
      checkUsernameAvailability(debouncedUsername);
    } else {
      setUsernameAvailable(null);
    }
  }, [debouncedUsername]);

  // Check email availability
  useEffect(() => {
    if (debouncedEmail && /^\S+@\S+\.\S+$/.test(debouncedEmail)) {
      checkEmailAvailability(debouncedEmail);
    } else {
      setEmailAvailable(null);
    }
  }, [debouncedEmail]);

  const checkUsernameAvailability = async (username) => {
    setUsernameChecking(true);
    try {
      const response = await fetch(`http://localhost:5000/api/auth/check-username/${encodeURIComponent(username)}`);
      const data = await response.json();
      setUsernameAvailable(data.available);
    } catch (error) {
      console.error('Error checking username:', error);
      setUsernameAvailable(null);
    } finally {
      setUsernameChecking(false);
    }
  };

  const checkEmailAvailability = async (email) => {
    setEmailChecking(true);
    try {
      const response = await fetch(`http://localhost:5000/api/auth/check-email/${encodeURIComponent(email)}`);
      const data = await response.json();
      setEmailAvailable(data.available);
    } catch (error) {
      console.error('Error checking email:', error);
      setEmailAvailable(null);
    } finally {
      setEmailChecking(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'useAdminEmail') {
      setForm((f) => ({ 
        ...f, 
        [name]: checked,
        businessEmail: checked ? f.email : ""
      }));
    } else if (name === 'province') {
      // Reset city and barangay when province changes
      setForm((f) => ({ ...f, province: value, city: "", barangay: "" }));
    } else if (name === 'city') {
      // Reset barangay when city changes
      setForm((f) => ({ ...f, city: value, barangay: "" }));
    } else {
      setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    }
  };

  const validateStep = () => {
    const err = {};
    if (step === 0) {
      if (!form.email) err.email = "Required";
      else if (!/^\S+@\S+\.\S+$/.test(form.email)) err.email = "Invalid email address";
      else if (emailAvailable === false) err.email = "Email already exists";
      
      if (!form.username) err.username = "Required";
      else if (!/^[a-zA-Z0-9_]{3,20}$/.test(form.username)) err.username = "Username must be 3-20 characters";
      else if (usernameAvailable === false) err.username = "Username already exists";
      
      if (!form.mobile) err.mobile = "Required";
      else if (!/^\d{10,15}$/.test(form.mobile)) err.mobile = "Invalid mobile number";
      if (!form.password) err.password = "Required";
      else if (form.password.length < 6) err.password = "Min 6 chars";
      if (form.password !== form.confirmPassword) err.confirmPassword = "Passwords do not match";
    }
    if (step === 1) {
      if (!form.otp) err.otp = "Required";
      else if (!/^[A-Za-z0-9]{4}$/.test(form.otp)) err.otp = "Please enter a 4-character OTP";
    }
    if (step === 2) {
      if (!form.businessName) err.businessName = "Required";
      if (!form.useAdminEmail && !form.businessEmail) err.businessEmail = "Required";
      else if (!form.useAdminEmail && form.businessEmail && !/^\S+@\S+\.\S+$/.test(form.businessEmail))
        err.businessEmail = "Invalid email address";
      if (!form.businessType) err.businessType = "Required";
      if (form.businessType === "Others" && !form.customBusinessType) 
        err.customBusinessType = "Please specify business type";
      if (!form.province) err.province = "Required";
      if (!form.city) err.city = "Required";
      if (!form.barangay) err.barangay = "Required";
      if (!form.houseNumber) err.houseNumber = "Required";
    }
    if (step === 3) {
      // Required document types
      const requiredDocTypes = [
        'Business Registration Certificate',
        'Mayor\'s Permit',
        'BIR Certificate of Registration'
      ];
      
      if (!form.documents || form.documents.length === 0) {
        err.documents = "Please upload at least one business document";
      }
      if (form.documents.length !== form.documentTypes.length) {
        err.documentTypes = "Please specify document type for each uploaded file";
      }
      if (form.documentTypes.some(type => !type)) {
        err.documentTypes = "Please specify document type for each uploaded file";
      }
      
      // Check if all required document types are uploaded
      const uploadedTypes = form.documentTypes.filter(type => type && type.trim() !== '');
      const missingRequiredTypes = requiredDocTypes.filter(requiredType => 
        !uploadedTypes.some(uploadedType => 
          uploadedType.includes(requiredType.replace(/'/g, ''))
        )
      );
      
      if (missingRequiredTypes.length > 0) {
        err.documents = `Missing required documents: ${missingRequiredTypes.join(', ')}. Please upload all three required documents.`;
      }
    }
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleNext = async () => {
    if (!validateStep()) return;

    if (step === 0) {
      // Ensure availability checks are complete before proceeding
      if (emailChecking || usernameChecking) {
        setErrors({ general: "Please wait for availability checks to complete" });
        return;
      }
      
      if (emailAvailable === false || usernameAvailable === false) {
        setErrors({ general: "Please fix the availability issues before proceeding" });
        return;
      }

      setLoading(true);
      try {
        const response = await fetch("http://localhost:5000/api/otp/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.email }),
        });
        if (response.ok) {
          setStep((s) => s + 1);
        } else {
          const error = await response.json();
          setErrors({ email: error.error || "Failed to send OTP" });
        }
      } catch {
        setErrors({ email: "Network error. Please try again." });
      } finally {
        setLoading(false);
      }
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => setStep((s) => Math.max(0, s - 1));

  const handleFinish = async () => {
    if (!validateStep()) return;
    setLoading(true);
    
    try {
      // Step 1: Register business
      setErrors({ general: "Creating your business account..." });
      const businessResponse = await fetch("http://localhost:5000/api/business/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          username: form.username,
          businessName: form.businessName,
          businessEmail: form.useAdminEmail ? form.email : form.businessEmail,
          businessType: form.businessType === "Others" ? form.customBusinessType : form.businessType,
          country: form.country,
          province: form.province,
          city: form.city,
          barangay: form.barangay,
          houseNumber: form.houseNumber,
          mobile: form.mobile,
          password: form.password,
        }),
      });
      
      if (!businessResponse.ok) {
        const error = await businessResponse.json();
        if (error.error?.includes('username') || error.error?.includes('Username')) {
          setErrors({ general: "Username already exists. Please go back and choose a different username." });
        } else if (error.error?.includes('email') || error.error?.includes('Email')) {
          setErrors({ general: "Email already exists. Please go back and use a different email address." });
        } else {
          setErrors({ general: error.error || "Registration failed. Please try again." });
        }
        return;
      }

      const result = await businessResponse.json();
      const businessId = result.business?.id;
      
      if (!businessId) {
        setErrors({ general: "Registration successful, but failed to get business ID. Please contact support." });
        return;
      }
      
      // Step 2: Upload documents
      setErrors({ general: "Uploading your business documents..." });
      const formData = new FormData();
      formData.append('business_id', businessId);
      formData.append('document_types', JSON.stringify(form.documentTypes));
      
      form.documents.forEach((file) => {
        formData.append('documents', file);
      });

      const documentResponse = await fetch(
        "http://localhost:5000/api/documents/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      if (documentResponse.ok) {
        const docResult = await documentResponse.json();
        localStorage.setItem("token", result.token);
        localStorage.setItem("user", JSON.stringify(result.user));
        setErrors({}); // Clear loading message
        
        // Check if all required documents were uploaded
        if (docResult.allRequiredUploaded) {
          setSuccess(true);
        } else {
          setErrors({ 
            general: `${docResult.message}. Your account was created successfully, but you need to upload all required documents before verification can begin.` 
          });
        }
      } else {
        const docError = await documentResponse.json();
        setErrors({ general: `Document upload failed: ${docError.error}. Your account was created, but documents couldn't be uploaded.` });
      }
    } catch (error) {
      console.error("Registration error:", error);
      setErrors({ general: "Network error. Please check your connection and try again." });
    } finally {
      setLoading(false);
    }
  };

  const progress = ((step + 1) / steps.length) * 100;

  if (success) {
    return (
      <Background variant="gradientBlue" pattern="dots" overlay floatingElements>
        <div className="flex flex-col items-center justify-center px-4 py-12">
          <Card className="rounded-3xl p-10 flex flex-col items-center max-w-2xl">
            <SectionHeader className="text-3xl md:text-4xl text-gray-900 mb-4">
              📄 Application Submitted!
            </SectionHeader>
            <p className="text-gray-800 mb-6 text-base text-center max-w-md">
              Your business application has been submitted successfully! Our verification team will review your documents.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 w-full max-w-md">
              <h4 className="font-semibold text-blue-800 mb-2">What happens next?</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Document verification (1-3 business days)</li>
                <li>• Email notification once complete</li>
                <li>• Full access upon approval</li>
              </ul>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 w-full max-w-md">
              <p className="text-sm text-yellow-800 text-center">
                <strong>Please wait 1-3 business days</strong> for verification. You will receive an email notification once the review is complete.
              </p>
            </div>
            
            <Button
              label="Go to Login"
              onClick={() => (window.location.href = "/login")}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2 rounded-full font-semibold shadow"
            />
          </Card>
        </div>
      </Background>
    );
  }

  return (
    <Background variant="gradientBlue" pattern="dots" overlay floatingElements>
      <div className="flex justify-center px-4 py-10">
        <Card className="w-full max-w-5xl overflow-hidden rounded-3xl p-0">
          <div className="md:flex">
            <aside className="hidden md:flex md:w-5/12 items-center justify-center bg-gradient-to-br from-blue-600 to-blue-400 p-10 relative">
              <div className="text-center max-w-xs">
                <div className="absolute top-8 left-10">
                  <Logo size={48} />
                </div>
                <h3 className="text-white text-2xl font-bold mb-4">Welcome to your business journey!</h3>
                <p className="text-white/85 text-sm">Let's set up your account in a few easy steps.</p>
              </div>
            </aside>
            <main className="w-full md:w-7/12 p-6 md:p-10 flex flex-col">
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <div className="w-2/3">
                    <ProgressBar percent={progress} />
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-600">
                      {steps.map((s, i) => (
                        <span key={s.label} className={`inline-block ml-3 ${i === step ? "text-gray-900 font-semibold" : ""}`}>
                          {s.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <Stepper steps={steps} currentStep={step} />
                </div>
              </div>

              <div className="flex-1">
                {errors?.general && (
                  <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">{errors.general}</div>
                )}

                <div className="max-w-lg">
                  {step === 0 && (
                    <div className="space-y-4">
                      <SectionHeader className="text-2xl md:text-3xl text-gray-900">Account Info</SectionHeader>
                      <div className="grid gap-4">
                        <div>
                          <label className="block mb-1 text-sm text-gray-700 font-medium">Email</label>
                          <div className="relative">
                            <Input 
                              ref={inputRef} 
                              name="email" 
                              value={form.email} 
                              onChange={handleChange} 
                              placeholder="Enter your email address" 
                              type="email" 
                              error={errors.email} 
                            />
                            {emailChecking && (
                              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <Loader size="sm" />
                              </div>
                            )}
                          </div>
                          {form.email && !emailChecking && emailAvailable !== null && (
                            <p className={`text-xs mt-1 ${emailAvailable ? 'text-green-600' : 'text-red-500'}`}>
                              {emailAvailable ? '✓ Email is available' : '✗ Email already exists'}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block mb-1 text-sm text-gray-700 font-medium">Username</label>
                          <div className="relative">
                            <Input 
                              name="username" 
                              value={form.username} 
                              onChange={handleChange} 
                              placeholder="Choose a username (3-20 characters)" 
                              type="text" 
                              error={errors.username} 
                            />
                            {usernameChecking && (
                              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <Loader size="sm" />
                              </div>
                            )}
                          </div>
                          {form.username && !usernameChecking && usernameAvailable !== null && (
                            <p className={`text-xs mt-1 ${usernameAvailable ? 'text-green-600' : 'text-red-500'}`}>
                              {usernameAvailable ? '✓ Username is available' : '✗ Username already exists'}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block mb-1 text-sm text-gray-700 font-medium">Mobile Number</label>
                          <Input 
                            name="mobile" 
                            value={form.mobile} 
                            onChange={handleChange} 
                            placeholder="09xxxxxxxxx" 
                            type="tel" 
                            maxLength={15} 
                            error={errors.mobile} 
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Enter your Philippine mobile number (e.g., 09123456789)
                          </p>
                        </div>
                        <div>
                          <label className="block mb-1 text-sm text-gray-700 font-medium">Password</label>
                          <PasswordInput
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            placeholder="Enter password"
                            error={errors.password}
                          />
                        </div>
                        <div>
                          <label className="block mb-1 text-sm text-gray-700 font-medium">Password Confirmation</label>
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
                  )}

                  {step === 1 && (
                    <div className="space-y-4">
                      <SectionHeader className="text-2xl md:text-3xl text-gray-900">OTP Verification</SectionHeader>
                      <p className="text-gray-700 mb-2 text-sm">
                        We've sent a 4-character verification code to <strong>{form.email}</strong>.
                      </p>
                      <div>
                        <label className="block mb-1 text-sm text-gray-700 font-medium">Enter OTP</label>
                        <Input
                          ref={inputRef}
                          name="otp"
                          value={form.otp}
                          onChange={async (e) => {
                            const value = e.target.value.slice(0, 4);
                            setForm((f) => ({ ...f, otp: value }));
                            if (errors.otp) setErrors({ ...errors, otp: null });
                            if (value.length === 4) {
                              setLoading(true);
                              try {
                                const otpResponse = await fetch("http://localhost:5000/api/otp/verify", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ email: form.email, otp: value }),
                                });
                                if (otpResponse.ok) {
                                  setOtpVerified(true);
                                  setTimeout(() => {
                                    setStep((s) => s + 1);
                                    setOtpVerified(false);
                                  }, 800);
                                } else {
                                  const error = await otpResponse.json();
                                  setErrors({ otp: error.error || "OTP verification failed" });
                                }
                              } catch {
                                setErrors({ otp: "Network error. Please try again." });
                              } finally {
                                setLoading(false);
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
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            OTP verified successfully!
                          </div>
                        )}
                      </div>
                      <div className="text-center">
                        <button
                          type="button"
                          onClick={async () => {
                            setLoading(true);
                            try {
                              const response = await fetch("http://localhost:5000/api/otp/resend", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ email: form.email }),
                              });
                              if (response.ok) alert("New OTP sent successfully!");
                              else {
                                const error = await response.json();
                                alert(error.error || "Failed to resend OTP");
                              }
                            } catch {
                              alert("Network error. Please try again.");
                            } finally {
                              setLoading(false);
                            }
                          }}
                          className="text-gray-700 hover:text-gray-900 text-sm underline"
                          disabled={loading}
                        >
                          {loading ? "Sending..." : "Resend OTP"}
                        </button>
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-4">
                      <SectionHeader className="text-2xl md:text-3xl text-gray-900">Business Details</SectionHeader>
                      <div className="grid gap-4">
                        <div>
                          <label className="block mb-1 text-sm text-gray-700 font-medium">Business Name <span className="text-red-500">*</span></label>
                          <Input name="businessName" value={form.businessName} onChange={handleChange} placeholder="Enter business name" error={errors.businessName} />
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
                          <label className="block mb-1 text-sm text-gray-700 font-medium">Business Type <span className="text-red-500">*</span></label>
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
                          <div className="mb-2 mt-4 font-semibold text-gray-900">Business Location</div>
                          <div className="space-y-4">
                            <div>
                              <label className="block mb-1 text-sm text-gray-700 font-medium">Country</label>
                              <input
                                type="text"
                                value="Philippines"
                                disabled
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-600 cursor-not-allowed"
                              />
                            </div>
                            
                            <div>
                              <label className="block mb-1 text-sm text-gray-700 font-medium">Province <span className="text-red-500">*</span></label>
                              <select
                                name="province"
                                value={form.province}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                style={{ borderColor: errors.province ? '#ef4444' : '' }}
                              >
                                <option value="">Select province</option>
                                {getProvinces().map((province) => (
                                  <option key={province} value={province}>
                                    {province}
                                  </option>
                                ))}
                              </select>
                              {errors.province && (
                                <p className="text-red-500 text-sm mt-1">{errors.province}</p>
                              )}
                            </div>

                            <div>
                              <label className="block mb-1 text-sm text-gray-700 font-medium">City/Municipality <span className="text-red-500">*</span></label>
                              <select
                                name="city"
                                value={form.city}
                                onChange={handleChange}
                                disabled={!form.province}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                style={{ borderColor: errors.city ? '#ef4444' : '' }}
                              >
                                <option value="">Select city/municipality</option>
                                {form.province && getCities(form.province).map((city) => (
                                  <option key={city} value={city}>
                                    {city}
                                  </option>
                                ))}
                              </select>
                              {errors.city && (
                                <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                              )}
                            </div>

                            <div>
                              <label className="block mb-1 text-sm text-gray-700 font-medium">Barangay <span className="text-red-500">*</span></label>
                              <select
                                name="barangay"
                                value={form.barangay}
                                onChange={handleChange}
                                disabled={!form.city}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                style={{ borderColor: errors.barangay ? '#ef4444' : '' }}
                              >
                                <option value="">Select barangay</option>
                                {form.city && getBarangays(form.province, form.city).map((barangay) => (
                                  <option key={barangay} value={barangay}>
                                    {barangay}
                                  </option>
                                ))}
                              </select>
                              {errors.barangay && (
                                <p className="text-red-500 text-sm mt-1">{errors.barangay}</p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="block mb-1 text-sm text-gray-700 font-medium">Street No./Purok/House Number <span className="text-red-500">*</span></label>
                          <Input name="houseNumber" value={form.houseNumber} onChange={handleChange} placeholder="Enter street no., purok, or house number" error={errors.houseNumber} />
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-4">
                      <SectionHeader className="text-2xl md:text-3xl text-gray-900">Business Documents</SectionHeader>
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

                      <DocumentUploadSection 
                        documents={form.documents}
                        documentTypes={form.documentTypes}
                        onDocumentsChange={(documents, types) => {
                          setForm(f => ({ ...f, documents, documentTypes: types }));
                        }}
                        error={errors.documents || errors.documentTypes}
                      />

                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                        <p className="text-sm text-yellow-800">
                          <strong>Important:</strong> After submitting your documents, please allow 1-3 business days for verification. 
                          You will receive an email notification once the review is complete.
                        </p>
                      </div>

                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                        <h4 className="font-semibold text-green-800 mb-2">💡 Tips for Better Verification:</h4>
                        <ul className="text-sm text-green-700 space-y-1">
                          <li>• Ensure documents are clear and readable</li>
                          <li>• Use good lighting when taking photos</li>
                          <li>• Upload high-quality scans (PDF preferred)</li>
                          <li>• Make sure all text is legible</li>
                          <li>• Documents should be current and valid</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 md:mt-6 flex items-center justify-between">
                {step > 0 ? (
                  <Button onClick={handleBack} variant="secondary" className="w-28">Back</Button>
                ) : (
                  <div />
                )}
                {step < steps.length - 1 ? (
                  step !== 1 ? (
                    <Button 
                      onClick={handleNext} 
                      disabled={loading || (step === 0 && (emailChecking || usernameChecking || emailAvailable === false || usernameAvailable === false))} 
                      variant="primary" 
                      className="w-32"
                    >
                      {loading ? <Loader size="sm" /> : 
                       (step === 0 && (emailChecking || usernameChecking)) ? "Checking..." : "Next"}
                    </Button>
                  ) : (
                    <div className="text-sm text-gray-700">{loading ? "Verifying..." : "Enter the 4-character code"}</div>
                  )
                ) : (
                  <Button onClick={handleFinish} disabled={loading} variant="primary" className="w-32">
                    {loading ? <Loader className="mr-2" size="sm" /> : null}
                    {loading ? "Processing..." : "Submit Application"}
                  </Button>
                )}
              </div>
            </main>
          </div>
        </Card>
      </div>
    </Background>
  );
}