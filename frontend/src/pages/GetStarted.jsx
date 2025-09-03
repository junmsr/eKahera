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
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validateStep = () => {
    let err = {};
    if (step === 0) {
      if (!form.email) err.email = "Required";
      else if (!/^\S+@\S+\.\S+$/.test(form.email)) err.email = "Invalid email address";
      if (!form.username) err.username = "Required";
      else if (!/^[a-zA-Z0-9_]{3,20}$/.test(form.username)) err.username = "Username must be 3-20 characters, letters, numbers, and underscores only";
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
      // Send OTP to email
      setLoading(true);
      try {
        const response = await fetch('http://localhost:5000/api/otp/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: form.email }),
        });
        
        if (response.ok) {
          setStep((s) => s + 1);
        } else {
          const error = await response.json();
          setErrors({ email: error.error || 'Failed to send OTP' });
        }
      } catch (error) {
        setErrors({ email: 'Network error. Please try again.' });
      } finally {
        setLoading(false);
      }
         } else if (step === 1) {
       // OTP verification is now handled automatically in the input onChange
       // Just proceed to next step if OTP is already verified
       if (form.otp.length === 4 && !errors.otp) {
         setStep((s) => s + 1);
       }
     } else {
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => setStep((s) => s - 1);

  const handleFinish = async () => {
    if (!validateStep()) return;
    setLoading(true);
    
    try {
      // Register business (OTP already verified in previous step)
      const businessResponse = await fetch('http://localhost:5000/api/business/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: form.email,
          username: form.username,
          businessName: form.businessName,
          businessType: form.businessType,
          country: form.country,
          businessAddress: form.businessAddress,
          houseNumber: form.houseNumber,
          mobile: form.mobile,
          password: form.password
        }),
      });
      
      if (businessResponse.ok) {
        const result = await businessResponse.json();
        // Store token in localStorage
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        setSuccess(true);
      } else {
        const error = await businessResponse.json();
        setErrors({ general: error.error || 'Registration failed' });
      }
    } catch (error) {
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
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
              Your business account has been created successfully! You can now log in with your email and password.
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
              <label className="block mb-1 font-medium">Username</label>
              <Input
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="Choose a username (3-20 characters)"
                type="text"
                error={errors.username}
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
                         <p className="text-gray-600 mb-4 text-center">
               We've sent a 4-character verification code to <strong>{form.email}</strong><br/>
               <span className="text-sm text-blue-600">The code will be verified automatically when you enter all 4 characters</span>
             </p>
            <div className="mb-5">
              <label className="block mb-1 font-medium">Enter OTP</label>
              <Input
                ref={inputRef}
                name="otp"
                value={form.otp}
                onChange={async (e) => {
                  // Allow both letters and numbers, limit to 4 characters
                  const value = e.target.value.slice(0, 4);
                  setForm({ ...form, otp: value });
                  
                  // Clear OTP error when user starts typing
                  if (errors.otp) {
                    setErrors({ ...errors, otp: null });
                  }
                  
                  // Auto-verify when 4 characters are entered
                  if (value.length === 4) {
                    setLoading(true);
                    try {
                      const otpResponse = await fetch('http://localhost:5000/api/otp/verify', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ 
                          email: form.email, 
                          otp: value 
                        }),
                      });
                      
                      if (otpResponse.ok) {
                        setOtpVerified(true);
                        // Show success message briefly before proceeding
                        setTimeout(() => {
                          setStep((s) => s + 1);
                          setOtpVerified(false);
                        }, 1000);
                      } else {
                        const error = await otpResponse.json();
                        setErrors({ otp: error.error || 'OTP verification failed' });
                      }
                    } catch (error) {
                      setErrors({ otp: 'Network error. Please try again.' });
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
                 <div className="mt-2 text-blue-600 text-sm font-medium flex items-center">
                   <svg className="animate-spin w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24">
                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                   </svg>
                   Verifying OTP...
                 </div>
               )}
               {otpVerified && (
                 <div className="mt-2 text-green-600 text-sm font-medium flex items-center">
                   <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
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
                    const response = await fetch('http://localhost:5000/api/otp/resend', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email: form.email }),
                    });
                    if (response.ok) {
                      alert('New OTP sent successfully!');
                    } else {
                      const error = await response.json();
                      alert(error.error || 'Failed to resend OTP');
                    }
                  } catch (error) {
                    alert('Network error. Please try again.');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="text-blue-600 hover:text-blue-800 text-sm underline"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Resend OTP'}
              </button>
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
            
            {/* General Error Display */}
            {errors.general && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {errors.general}
              </div>
            )}
            
            {renderStepContent()}
            
                         <div className="flex justify-between mt-10 gap-2">
               {step > 0 && (
                 <Button onClick={handleBack} variant="secondary" className="w-28">
                   Back
                 </Button>
               )}
               {step < steps.length - 1 && step !== 1 ? (
                 <Button
                   onClick={handleNext}
                   disabled={Object.keys(errors).length > 0 || loading}
                   variant="primary"
                   className="w-28 ml-auto"
                 >
                   {loading ? <Loader size="sm" /> : "Next"}
                 </Button>
               ) : step === 1 ? (
                 <div className="ml-auto text-sm text-gray-500">
                   {loading ? "Verifying..." : "Enter the 4-character code"}
                 </div>
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
