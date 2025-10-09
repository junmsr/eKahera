import React, { useEffect, useRef, useState } from "react";
import SectionHeader from "../../../components/layout/SectionHeader";
import Input from "../../../components/common/Input";
import Button from "../../../components/common/Button";
import Loader from "../../../components/common/Loader";
import GetStartedLayout from "./GetStartedLayout";

export default function GetStartedSingle() {
  const steps = [
    { label: "Account Info", icon: "👤" },
    { label: "OTP Verification", icon: "🔒" },
    { label: "Business Details", icon: "🏢" },
  ];

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    email: "",
    username: "",
    businessName: "",
    businessType: "",
    country: "",
    businessAddress: "",
    houseNumber: "",
    mobile: "",
    password: "",
    confirmPassword: "",
    otp: "",
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, [step]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const validateStep = () => {
    const err = {};
    if (step === 0) {
      if (!form.email) err.email = "Required";
      else if (!/^\S+@\S+\.\S+$/.test(form.email)) err.email = "Invalid email address";
      if (!form.username) err.username = "Required";
      else if (!/^[a-zA-Z0-9_]{3,20}$/.test(form.username)) err.username = "Username must be 3-20 characters";
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
      if (!form.businessType) err.businessType = "Required";
      if (!form.country) err.country = "Required";
      if (!form.businessAddress) err.businessAddress = "Required";
    }
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleNext = async () => {
    if (!validateStep()) return;

    if (step === 0) {
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
      const businessResponse = await fetch("http://localhost:5000/api/business/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          username: form.username,
          businessName: form.businessName,
          businessType: form.businessType,
          country: form.country,
          businessAddress: form.businessAddress,
          houseNumber: form.houseNumber,
          mobile: form.mobile,
          password: form.password,
        }),
      });
      if (businessResponse.ok) {
        const result = await businessResponse.json();
        localStorage.setItem("token", result.token);
        localStorage.setItem("user", JSON.stringify(result.user));
        setSuccess(true);
      } else {
        const error = await businessResponse.json();
        setErrors({ general: error.error || "Registration failed" });
      }
    } catch {
      setErrors({ general: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const progress = ((step + 1) / steps.length) * 100;

  if (success) {
    return (
      <GetStartedLayout
        step={step}
        steps={steps}
        progress={100}
        loading={false}
        errors={{}}
      >
        <div className="flex flex-col items-center justify-center px-4 py-12">
          <SectionHeader className="text-3xl md:text-4xl text-gray-900 mb-4">
            🎉 Registration Complete!
          </SectionHeader>
          <p className="text-gray-800 mb-8 text-base text-center max-w-md">
            Your business account has been created successfully! You can now log in with your email and password.
          </p>
          <Button
            label="Back to Home"
            onClick={() => (window.location.href = "/")}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2 rounded-full font-semibold shadow"
          />
        </div>
      </GetStartedLayout>
    );
  }

  return (
    <GetStartedLayout
      step={step}
      steps={steps}
      progress={progress}
      loading={loading}
      errors={errors}
      onBack={handleBack}
      onNext={handleNext}
      onFinish={handleFinish}
    >
      <div className="max-w-lg">
                  {step === 0 && (
                    <div className="space-y-4">
                      <div className="grid gap-4">
                        <div>
                          <label className="block mb-1 text-sm text-gray-700 font-medium">Email</label>
                          <Input ref={inputRef} name="email" value={form.email} onChange={handleChange} placeholder="Enter your email address" type="email" error={errors.email} />
                        </div>
                        <div>
                          <label className="block mb-1 text-sm text-gray-700 font-medium">Username</label>
                          <Input name="username" value={form.username} onChange={handleChange} placeholder="Choose a username (3-20 characters)" type="text" error={errors.username} />
                        </div>
                        <div>
                          <label className="block mb-1 text-sm text-gray-700 font-medium">Mobile Number</label>
                          <Input name="mobile" value={form.mobile} onChange={handleChange} placeholder="09xxxxxxxxx" type="tel" maxLength={15} error={errors.mobile} />
                        </div>
                        <div>
                          <label className="block mb-1 text-sm text-gray-700 font-medium">Password</label>
                          <Input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            placeholder="Enter password"
                            error={errors.password}
                            suffix={
                              <Button
                                type="button"
                                onClick={() => setShowPassword((v) => !v)}
                                isPasswordToggle
                                showPassword={showPassword}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                tabIndex={-1}
                              />
                            }
                          />
                        </div>
                        <div>
                          <label className="block mb-1 text-sm text-gray-700 font-medium">Password Confirmation</label>
                          <Input
                            type={showConfirm ? "text" : "password"}
                            name="confirmPassword"
                            value={form.confirmPassword}
                            onChange={handleChange}
                            placeholder="Re-enter password"
                            error={errors.confirmPassword}
                            suffix={
                              <Button
                                type="button"
                                onClick={() => setShowConfirm((v) => !v)}
                                isPasswordToggle
                                showPassword={showConfirm}
                                aria-label={showConfirm ? "Hide password" : "Show password"}
                                tabIndex={-1}
                              />
                            }
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 1 && (
                    <div className="space-y-4">
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
                      <div className="grid gap-4">
                        <div>
                          <label className="block mb-1 text-sm text-gray-700 font-medium">Business Name <span className="text-red-500">*</span></label>
                          <Input name="businessName" value={form.businessName} onChange={handleChange} placeholder="Enter business name" error={errors.businessName} />
                        </div>
                        <div>
                          <label className="block mb-1 text-sm text-gray-700 font-medium">Business Type <span className="text-red-500">*</span></label>
                          <Input name="businessType" value={form.businessType} onChange={handleChange} placeholder="e.g. Retail, Services, etc." error={errors.businessType} />
                        </div>
                        <div>
                          <div className="mb-2 mt-4 font-semibold text-gray-900">Business Location</div>
                          <label className="block mb-1 text-sm text-gray-700 font-medium">Country <span className="text-red-500">*</span></label>
                          <Input name="country" value={form.country} onChange={handleChange} placeholder="Enter country" error={errors.country} />
                        </div>
                        <div>
                          <label className="block mb-1 text-sm text-gray-700 font-medium">Business Address <span className="text-red-500">*</span></label>
                          <Input name="businessAddress" value={form.businessAddress} onChange={handleChange} placeholder="Enter business address" error={errors.businessAddress} />
                        </div>
                        <div>
                          <label className="block mb-1 text-sm text-gray-700 font-medium">House no./ Street Name / Landmark (optional)</label>
                          <Input name="houseNumber" value={form.houseNumber} onChange={handleChange} placeholder="Enter house no., street, or landmark (optional)" />
                        </div>
                      </div>
                    </div>
                  )}
      </div>
    </GetStartedLayout>
  );
}


