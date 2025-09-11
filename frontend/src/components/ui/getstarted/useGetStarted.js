import { useEffect, useRef, useState } from "react";

export default function useGetStarted() {
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
      else if (!/^\S+@\S+\.\S+$/.test(form.email))
        err.email = "Invalid email address";
      if (!form.username) err.username = "Required";
      else if (!/^[a-zA-Z0-9_]{3,20}$/.test(form.username))
        err.username = "Username must be 3-20 characters";
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
      else if (!/^[A-Za-z0-9]{4}$/.test(form.otp))
        err.otp = "Please enter a 4-character OTP";
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
      const businessResponse = await fetch(
        "http://localhost:5000/api/business/register",
        {
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
        }
      );
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

  return {
    steps,
    step,
    setStep,
    form,
    setForm,
    errors,
    setErrors,
    showPassword,
    setShowPassword,
    showConfirm,
    setShowConfirm,
    loading,
    setLoading,
    success,
    otpVerified,
    setOtpVerified,
    inputRef,
    handleChange,
    validateStep,
    handleNext,
    handleBack,
    handleFinish,
    progress,
  };
}
