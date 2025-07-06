import React, { useState, useRef, useEffect } from "react";
import Background from "../components/Background";
import Card from "../components/Card";
import Input from "../components/Input";
import Button from "../components/Button";
import Loader from "../components/Loader";
import Stepper from "../components/Stepper";
import ProgressBar from "../components/ProgressBar";
import SectionHeader from "../components/SectionHeader";
import Logo from "../components/Logo";

const steps = [
  { label: "Account Info", icon: "👤" },
  { label: "OTP Verification", icon: "🔒" },
  { label: "Business Details", icon: "🏢" },
];

export default function GetStarted() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    email: "",
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
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, [step]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validateStep = () => {
    let err = {};
    if (step === 0) {
      if (!form.email) err.email = "Required";
      else if (!/^\S+@\S+\.\S+$/.test(form.email)) err.email = "Invalid email address";
      if (!form.mobile) err.mobile = "Required";
      else if (!/^\d{10,15}$/.test(form.mobile)) err.mobile = "Invalid mobile number";
      if (!form.password) err.password = "Required";
      else if (form.password.length < 6) err.password = "Min 6 chars";
      if (form.password !== form.confirmPassword) err.confirmPassword = "Passwords do not match";
    }
    if (step === 1) {
      if (!form.otp) err.otp = "Required";
      else if (!/^\d{4,6}$/.test(form.otp)) err.otp = "Invalid OTP";
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

  const handleNext = () => {
    if (validateStep()) setStep((s) => s + 1);
  };

  const handleBack = () => setStep((s) => s - 1);

  const handleFinish = () => {
    if (!validateStep()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 1200);
  };

  const progress = ((step + 1) / steps.length) * 100;

  if (success) {
    return (
      <Background variant="gradientPurple" pattern="dots" overlay floatingElements>
        <div className="flex flex-col items-center justify-center px-2 py-8">
          <Card className="rounded-3xl p-12 flex flex-col items-center">
            <SectionHeader className="text-4xl md:text-5xl text-purple-700 mb-4">
              🎉 Registration Complete!
            </SectionHeader>
            <p className="text-gray-600 mb-8 text-lg text-center max-w-md">
              Thank you for getting started with us. We'll be in touch soon!
            </p>
            <Button
              label="Back to Home"
              onClick={() => window.location.href = "/"}
              className="bg-gradient-to-r from-purple-500 to-purple-700 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:from-purple-600 hover:to-purple-800 transition-all text-lg"
            />
          </Card>
        </div>
      </Background>
    );
  }

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <div>
            <SectionHeader>Account Info</SectionHeader>
            <div className="mb-5">
              <label className="block mb-1 font-medium">Email</label>
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
            <div className="mb-5">
              <label className="block mb-1 font-medium">Mobile Number</label>
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
            <div className="mb-5">
              <label className="block mb-1 font-medium">Password</label>
              <Input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter password"
                error={errors.password}
                suffix={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="p-1 bg-transparent border-none shadow-none hover:bg-purple-100 rounded-full transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 hover:text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.403-3.22 1.125-4.575m2.122-2.122A9.956 9.956 0 0112 3c5.523 0 10 4.477 10 10 0 1.657-.403 3.22-1.125 4.575m-2.122 2.122A9.956 9.956 0 0112 21c-2.21 0-4.267-.72-5.947-1.947m0 0L3 21m0 0l3-3" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 hover:text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                }
              />
            </div>
            <div className="mb-5">
              <label className="block mb-1 font-medium">Password Confirmation</label>
              <Input
                type={showConfirm ? "text" : "password"}
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter password"
                error={errors.confirmPassword}
                suffix={
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="p-1 bg-transparent border-none shadow-none hover:bg-purple-100 rounded-full transition-colors"
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                    tabIndex={-1}
                  >
                    {showConfirm ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 hover:text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.403-3.22 1.125-4.575m2.122-2.122A9.956 9.956 0 0112 3c5.523 0 10 4.477 10 10 0 1.657-.403 3.22-1.125 4.575m-2.122 2.122A9.956 9.956 0 0112 21c-2.21 0-4.267-.72-5.947-1.947m0 0L3 21m0 0l3-3" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 hover:text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                }
              />
            </div>
          </div>
        );
      case 1:
        return (
          <div>
            <SectionHeader>OTP Verification</SectionHeader>
            <div className="mb-5">
              <label className="block mb-1 font-medium">Enter OTP</label>
              <Input
                ref={inputRef}
                name="otp"
                value={form.otp}
                onChange={handleChange}
                placeholder="Enter OTP"
                type="number"
                maxLength={6}
                error={errors.otp}
              />
            </div>
          </div>
        );
      case 2:
        return (
          <div>
            <SectionHeader>Business Details</SectionHeader>
            <div className="mb-5">
              <label className="block mb-1 font-medium">Business Name <span className="text-red-500">*</span></label>
              <Input
                name="businessName"
                value={form.businessName}
                onChange={handleChange}
                placeholder="Enter business name"
                error={errors.businessName}
              />
            </div>
            <div className="mb-5">
              <label className="block mb-1 font-medium">Business Type <span className="text-red-500">*</span></label>
              <Input
                name="businessType"
                value={form.businessType}
                onChange={handleChange}
                placeholder="e.g. Retail, Services, etc."
                error={errors.businessType}
              />
            </div>
            <div className="mb-2 mt-6 font-semibold text-purple-700">Business Location</div>
            <div className="mb-5">
              <label className="block mb-1 font-medium">Country <span className="text-red-500">*</span></label>
              <Input
                name="country"
                value={form.country}
                onChange={handleChange}
                placeholder="Enter country"
                error={errors.country}
              />
            </div>
            <div className="mb-5">
              <label className="block mb-1 font-medium">Business Address <span className="text-red-500">*</span></label>
              <Input
                name="businessAddress"
                value={form.businessAddress}
                onChange={handleChange}
                placeholder="Enter business address"
                error={errors.businessAddress}
              />
            </div>
            <div className="mb-5">
              <label className="block mb-1 font-medium">House no./ Street Name / Landmark (optional)</label>
              <Input
                name="houseNumber"
                value={form.houseNumber}
                onChange={handleChange}
                placeholder="Enter house no., street, or landmark (optional)"
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Background variant="gradientPurple" pattern="dots" overlay floatingElements>
      <div className="flex flex-col items-center justify-center px-2 py-8 mt-20">
        <Card className="w-full max-w-4xl flex flex-col md:flex-row overflow-hidden rounded-3xl p-0">
          <div className="hidden md:flex flex-col justify-center items-center bg-gradient-to-br from-purple-500 to-purple-400 w-1/2 p-12 relative">
            <div className="absolute top-6 left-6 flex items-center gap-2">
              <Logo size={56} />
            </div>
            <SectionHeader className="text-white text-3xl drop-shadow mb-2">
              Welcome to your business journey!
            </SectionHeader>
            <p className="text-white/80 text-center text-lg font-medium">
              Let's set up your account in a few easy steps.
            </p>
          </div>
          
          <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
            <div className="mb-8">
              <ProgressBar percent={progress} />
              <div className="flex justify-between mt-2 text-xs text-purple-400 font-medium">
                {steps.map((stepObj, idx) => (
                  <span
                    key={stepObj.label}
                    className={idx === step ? "text-purple-700 font-bold" : ""}
                  >
                    {stepObj.label}
                  </span>
                ))}
              </div>
            </div>
            
            <Stepper steps={steps} currentStep={step} />
            {renderStepContent()}
            
            <div className="flex justify-between mt-10 gap-2">
              {step > 0 && (
                <Button onClick={handleBack} variant="secondary" className="w-28">
                  Back
                </Button>
              )}
              {step < steps.length - 1 ? (
                <Button
                  onClick={handleNext}
                  disabled={Object.keys(errors).length > 0}
                  variant="primary"
                  className="w-28 ml-auto"
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleFinish}
                  disabled={loading}
                  variant="primary"
                  className="flex items-center min-w-[90px] justify-center w-32 ml-auto"
                >
                  {loading ? <Loader className="mr-2" size="sm" /> : null}
                  {loading ? "Finishing..." : "Finish"}
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </Background>
  );
}
