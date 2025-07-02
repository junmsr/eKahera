import React, { useState, useRef, useEffect } from "react";
import Card from "../components/Card";
import Input from "../components/Input";
import Button from "../components/Button";
import Loader from "../components/Loader";
import Stepper from "../components/Stepper";
import ProgressBar from "../components/ProgressBar";
import SectionHeader from "../components/SectionHeader";
import Footer from "../components/Footer";
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
      else if (!/^\S+@\S+\.\S+$/.test(form.email))
        err.email = "Invalid email address";
      if (!form.mobile) err.mobile = "Required";
      else if (!/^\d{10,15}$/.test(form.mobile))
        err.mobile = "Invalid mobile number";
      if (!form.password) err.password = "Required";
      else if (form.password.length < 6) err.password = "Min 6 chars";
      if (form.password !== form.confirmPassword)
        err.confirmPassword = "Passwords do not match";
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-white px-2 py-8">
        <Card variant="shadow">
          <SectionHeader>Registration Complete!</SectionHeader>
          <p className="text-gray-600 mb-6 text-lg">
            Thank you for getting started with us. We'll be in touch soon!
          </p>
          <a href="/" className="text-purple-600 hover:underline font-medium transition">Back to Home</a>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-white px-2 py-8 mt-20">
      <Card variant="shadow" className="w-full max-w-4xl flex flex-col md:flex-row overflow-hidden animate-fadeIn border border-white/40 z-10 p-0 md:p-0">
        {/* Left: Illustration/Branding */}
        <div className="hidden md:flex flex-col justify-center items-center bg-gradient-to-br from-purple-500 to-purple-400 w-1/2 p-10 relative">
          <div className="absolute top-6 left-6 flex items-center gap-2">
            <Logo size={48} />
          </div>
          <img
            src="https://undraw.co/api/illustrations/2e1b2b2e-2e1b-4e1b-8e1b-2e1b2b2e1b2e"
            alt="Get Started"
            className="w-64 h-64 object-contain mb-6 drop-shadow-xl animate-float"
            onError={(e) => (e.target.style.display = "none")}
          />
          <h3 className="text-white text-2xl font-semibold text-center mt-4">
            Welcome to your business journey!
          </h3>
          <p className="text-white/80 text-center mt-2">
            Let's set up your account in a few easy steps.
          </p>
        </div>
        {/* Right: Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-transparent">
          {/* Progress Bar */}
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
          {/* Step Content */}
          {step === 0 && (
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
                  variant="default"
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
                  variant="default"
                />
              </div>
              <div className="mb-5 relative">
                <label className="block mb-1 font-medium">Password</label>
                <Input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                  error={errors.password}
                  variant="default"
                />
                <Button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  variant="secondary"
                  className="absolute right-3 top-8 text-xs"
                >
                  {showPassword ? "Hide" : "Show"}
                </Button>
              </div>
              <div className="mb-5 relative">
                <label className="block mb-1 font-medium">
                  Password Confirmation
                </label>
                <Input
                  type={showConfirm ? "text" : "password"}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter password"
                  error={errors.confirmPassword}
                  variant="default"
                />
                <Button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  variant="secondary"
                  className="absolute right-3 top-8 text-xs"
                >
                  {showConfirm ? "Hide" : "Show"}
                </Button>
              </div>
            </div>
          )}
          {step === 1 && (
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
                  variant="default"
                />
              </div>
            </div>
          )}
          {step === 2 && (
            <div>
              <SectionHeader>Business Details</SectionHeader>
              <div className="mb-5">
                <label className="block mb-1 font-medium">
                  Business Name <span className="text-red-500">*</span>
                </label>
                <Input
                  name="businessName"
                  value={form.businessName}
                  onChange={handleChange}
                  placeholder="Enter business name"
                  error={errors.businessName}
                  variant="default"
                />
              </div>
              <div className="mb-5">
                <label className="block mb-1 font-medium">
                  Business Type <span className="text-red-500">*</span>
                </label>
                <Input
                  name="businessType"
                  value={form.businessType}
                  onChange={handleChange}
                  placeholder="e.g. Retail, Services, etc."
                  error={errors.businessType}
                  variant="default"
                />
              </div>
              <div className="mb-2 mt-6 font-semibold text-purple-700">
                Business Location
              </div>
              <div className="mb-5">
                <label className="block mb-1 font-medium">
                  Country <span className="text-red-500">*</span>
                </label>
                <Input
                  name="country"
                  value={form.country}
                  onChange={handleChange}
                  placeholder="Enter country"
                  error={errors.country}
                  variant="default"
                />
              </div>
              <div className="mb-5">
                <label className="block mb-1 font-medium">
                  Business Address <span className="text-red-500">*</span>
                </label>
                <Input
                  name="businessAddress"
                  value={form.businessAddress}
                  onChange={handleChange}
                  placeholder="Enter business address"
                  error={errors.businessAddress}
                  variant="default"
                />
              </div>
              <div className="mb-5">
                <label className="block mb-1 font-medium">
                  House no./ Street Name / Landmark (optional)
                </label>
                <Input
                  name="houseNumber"
                  value={form.houseNumber}
                  onChange={handleChange}
                  placeholder="Enter house no., street, or landmark (optional)"
                  variant="default"
                />
              </div>
            </div>
          )}
          {/* Navigation Buttons */}
          <div className="flex justify-between mt-10 gap-2">
            {step > 0 && (
              <Button
                onClick={handleBack}
                variant="secondary"
                className="w-28"
              >
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
                className="flex items-center min-w-[90px] justify-center w-28 ml-auto"
              >
                {loading ? <Loader className="mr-2" size="sm" /> : null}
                {loading ? "Finishing..." : "Finish"}
              </Button>
            )}
          </div>
        </div>
      </Card>
      <Footer />
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-16px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
