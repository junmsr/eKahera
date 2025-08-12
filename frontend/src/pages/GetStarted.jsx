import React, { useState, useRef, useEffect } from "react";
import Background from "../components/layout/Background";
import Card from "../components/common/Card";
import Input from "../components/common/Input";
import Button from "../components/common/Button";
import Loader from "../components/common/Loader";
import Stepper from "../components/common/Stepper";
import ProgressBar from "../components/common/ProgressBar";
import SectionHeader from "../components/layout/SectionHeader";
import Logo from "../components/common/Logo";

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
      <Background variant="gradientBlue" pattern="dots" overlay floatingElements>
        <div className="flex flex-col items-center justify-center px-2 py-8">
          <Card className="rounded-3xl p-12 flex flex-col items-center">
            <SectionHeader className="text-4xl md:text-5xl text-blue-700 mb-4">
              🎉 Registration Complete!
            </SectionHeader>
            <p className="text-gray-600 mb-8 text-lg text-center max-w-md">
              Thank you for getting started with us. We'll be in touch soon!
            </p>
            <Button
              label="Back to Home"
              onClick={() => window.location.href = "/"}
              className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:from-blue-600 hover:to-blue-800 transition-all text-lg"
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
                  <Button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    isPasswordToggle={true}
                    showPassword={showPassword}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    tabIndex={-1}
                  />
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
                  <Button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    isPasswordToggle={true}
                    showPassword={showConfirm}
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                    tabIndex={-1}
                  />
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
            <div className="mb-2 mt-6 font-semibold text-blue-700">Business Location</div>
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
    <Background variant="gradientBlue" pattern="dots" overlay floatingElements>
      <div className="flex flex-col items-center justify-center px-2 py-8 mt-20">
        <Card className="w-full max-w-4xl flex flex-col md:flex-row overflow-hidden rounded-3xl p-0">
          <div className="hidden md:flex flex-col justify-center items-center bg-gradient-to-br from-blue-500 to-blue-400 w-1/2 p-12 relative">
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
              <div className="flex justify-between mt-2 text-xs text-blue-400 font-medium">
                {steps.map((stepObj, idx) => (
                  <span
                    key={stepObj.label}
                    className={idx === step ? "text-blue-700 font-bold" : ""}
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
