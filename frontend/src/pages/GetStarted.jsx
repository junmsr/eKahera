import React, { useState, useRef, useEffect } from "react";

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
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <div className="bg-white backdrop-blur-lg p-8 rounded-2xl shadow-2xl text-center max-w-lg w-full flex flex-col items-center border border-white/40 z-10">
          <h2 className="text-2xl font-bold mb-2">Registration Complete!</h2>
          <p className="text-gray-600 mb-4">
            Thank you for getting started with us. We'll be in touch soon!
          </p>
          <a href="/" className="text-blue-600 hover:underline">
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden px-2 py-8 mt-28">
      <div className="w-full max-w-4xl bg-white backdrop-blur-lg rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden animate-fadeIn border border-white/40 z-10">
        {/* Left: Illustration/Branding */}
        <div className="hidden md:flex flex-col justify-center items-center bg-purple-500 w-1/2 p-10 relative">
          <div className="absolute top-6 left-6 flex items-center gap-2">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md">
              <span className="text-purple-600 font-bold text-lg">eK</span>
            </div>
            <span className="text-white text-2xl font-bold tracking-wide">
              eKahera
            </span>
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
        <div className="w-full md:w-1/2 p-8 flex flex-col justify-center bg-transparent">
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="w-full h-2 bg-purple-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
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
          {/* Stepper Circles with Icons */}
          <div className="flex items-center justify-center mb-8">
            {steps.map((stepObj, idx) => (
              <React.Fragment key={idx}>
                <div
                  className={`w-10 h-10 flex items-center justify-center rounded-full border-2 font-bold text-lg transition-all duration-300 shadow-md ${
                    idx < step
                      ? "bg-green-500 border-green-500 text-white"
                      : idx === step
                      ? "bg-purple-500 border-purple-600 text-white"
                      : "bg-purple-500 border-gray-300 text-gray-400"
                  }`}
                >
                  {stepObj.icon}
                </div>
                {idx < steps.length - 1 && (
                  <div className="w-8 h-1 bg-gray-300 mx-1 rounded" />
                )}
              </React.Fragment>
            ))}
          </div>
          {/* Step Content */}
          {step === 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-4 text-center tracking-tight">
                Account Info
              </h2>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Email</label>
                <input
                  ref={inputRef}
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 text-lg ${
                    errors.email
                      ? "border-red-400 ring-red-200"
                      : "border-gray-300 focus:ring-blue-200"
                  }`}
                  placeholder="Enter your email address"
                  type="email"
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Mobile Number</label>
                <input
                  name="mobile"
                  value={form.mobile}
                  onChange={handleChange}
                  className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 text-lg ${
                    errors.mobile
                      ? "border-red-400 ring-red-200"
                      : "border-gray-300 focus:ring-blue-200"
                  }`}
                  placeholder="09xxxxxxxxx"
                  type="tel"
                  maxLength={15}
                />
                {errors.mobile && (
                  <p className="text-red-500 text-xs mt-1">{errors.mobile}</p>
                )}
              </div>
              <div className="mb-4 relative">
                <label className="block mb-1 font-medium">Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 text-lg ${
                    errors.password
                      ? "border-red-400 ring-red-200"
                      : "border-gray-300 focus:ring-blue-200"
                  }`}
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-8 text-xs text-gray-500 hover:text-blue-600 transition"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                )}
              </div>
              <div className="mb-4 relative">
                <label className="block mb-1 font-medium">
                  Password Confirmation
                </label>
                <input
                  type={showConfirm ? "text" : "password"}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 text-lg ${
                    errors.confirmPassword
                      ? "border-red-400 ring-red-200"
                      : "border-gray-300 focus:ring-blue-200"
                  }`}
                  placeholder="Re-enter password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-8 text-xs text-gray-500 hover:text-blue-600 transition"
                  onClick={() => setShowConfirm((v) => !v)}
                >
                  {showConfirm ? "Hide" : "Show"}
                </button>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>
          )}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold mb-4 text-center tracking-tight">
                OTP Verification
              </h2>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Enter OTP</label>
                <input
                  ref={inputRef}
                  name="otp"
                  value={form.otp}
                  onChange={handleChange}
                  className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 text-lg ${
                    errors.otp
                      ? "border-red-400 ring-red-200"
                      : "border-gray-300 focus:ring-blue-200"
                  }`}
                  placeholder="Enter OTP"
                  type="number"
                  maxLength={6}
                />
                {errors.otp && (
                  <p className="text-red-500 text-xs mt-1">{errors.otp}</p>
                )}
              </div>
            </div>
          )}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold mb-4 text-center tracking-tight">
                Business Details
              </h2>
              <div className="mb-4">
                <label className="block mb-1 font-medium">
                  Business Name <span className="text-red-500">*</span>
                </label>
                <input
                  name="businessName"
                  value={form.businessName}
                  onChange={handleChange}
                  className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 text-lg ${
                    errors.businessName
                      ? "border-red-400 ring-red-200"
                      : "border-gray-300 focus:ring-blue-200"
                  }`}
                  placeholder="Enter business name"
                />
                {errors.businessName && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.businessName}
                  </p>
                )}
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">
                  Business Type <span className="text-red-500">*</span>
                </label>
                <input
                  name="businessType"
                  value={form.businessType}
                  onChange={handleChange}
                  className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 text-lg ${
                    errors.businessType
                      ? "border-red-400 ring-red-200"
                      : "border-gray-300 focus:ring-blue-200"
                  }`}
                  placeholder="e.g. Retail, Services, etc."
                />
                {errors.businessType && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.businessType}
                  </p>
                )}
              </div>
              <div className="mb-2 mt-6 font-semibold text-purple-700">
                Business Location
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">
                  Country <span className="text-red-500">*</span>
                </label>
                <input
                  name="country"
                  value={form.country}
                  onChange={handleChange}
                  className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 text-lg ${
                    errors.country
                      ? "border-red-400 ring-red-200"
                      : "border-gray-300 focus:ring-blue-200"
                  }`}
                  placeholder="Enter country"
                />
                {errors.country && (
                  <p className="text-red-500 text-xs mt-1">{errors.country}</p>
                )}
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">
                  Business Address <span className="text-red-500">*</span>
                </label>
                <input
                  name="businessAddress"
                  value={form.businessAddress}
                  onChange={handleChange}
                  className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 text-lg ${
                    errors.businessAddress
                      ? "border-red-400 ring-red-200"
                      : "border-gray-300 focus:ring-blue-200"
                  }`}
                  placeholder="Enter business address"
                />
                {errors.businessAddress && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.businessAddress}
                  </p>
                )}
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">
                  House no./ Street Name / Landmark (optional)
                </label>
                <input
                  name="houseNumber"
                  value={form.houseNumber}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 border-gray-300 focus:ring-blue-200 text-lg"
                  placeholder="Enter house no., street, or landmark (optional)"
                />
              </div>
            </div>
          )}
          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 gap-2">
            {step > 0 && (
              <button
                onClick={handleBack}
                className="px-4 py-2 bg-purple-100 rounded-lg hover:bg-purple-200 font-medium transition w-28"
              >
                Back
              </button>
            )}
            {step < steps.length - 1 ? (
              <button
                onClick={handleNext}
                className="ml-auto px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 font-medium transition w-28 disabled:opacity-50"
                disabled={Object.keys(errors).length > 0}
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="ml-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition flex items-center min-w-[90px] justify-center w-28"
                disabled={loading}
              >
                {loading ? <span className="loader mr-2"></span> : null}
                {loading ? "Finishing..." : "Finish"}
              </button>
            )}
          </div>
        </div>
        <style>{`
          .loader {
            border: 2px solid #f3f3f3;
            border-top: 2px solid #22c55e;
            border-radius: 50%;
            width: 18px;
            height: 18px;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .animate-fadeIn {
            animation: fadeIn 0.5s;
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-float {
            animation: float 3s ease-in-out infinite;
          }
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-16px); }
          }
        `}</style>
      </div>
    </div>
  );
}
