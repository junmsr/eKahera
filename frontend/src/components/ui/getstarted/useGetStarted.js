import { useEffect, useRef, useState } from "react";
import { api } from "../../../lib/api";

export default function useGetStarted() {
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
    region: "",
    province: "",
    city: "",
    barangay: "",
    regionName: "",
    provinceName: "",
    cityName: "",
    barangayName: "",
    houseNumber: "",
    mobile: "",
    password: "",
    confirmPassword: "",
    otp: "",
    documents: [],
    documentTypes: [],
    acceptTerms: false,
    acceptPrivacy: false,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, [step]);

  useEffect(() => {
    if (step === 1 && isOtpVerified) {
      handleNext();
    } else if (step === 1 && !isOtpVerified && form.otp && form.otp.length === 4) {
      handleNext();
    }
  }, [step, isOtpVerified, form.otp]);

  const handleLocationChange = (name, code, locationName) => {
    const reset = {};
    if (name === 'region') {
      reset.province = "";
      reset.city = "";
      reset.barangay = "";
      reset.provinceName = "";
      reset.cityName = "";
      reset.barangayName = "";
    } else if (name === 'province') {
      reset.city = "";
      reset.barangay = "";
      reset.cityName = "";
      reset.barangayName = "";
    } else if (name === 'city') {
      reset.barangay = "";
      reset.barangayName = "";
    }
    setForm((f) => ({
      ...f,
      [name]: code,
      [`${name}Name`]: locationName,
      ...reset
    }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'useAdminEmail') {
      setForm((f) => ({ 
        ...f, 
        [name]: checked,
        businessEmail: checked ? f.email : ""
      }));
    } else {
      setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    }
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
      if (!form.useAdminEmail && !form.businessEmail) err.businessEmail = "Required";
      else if (!form.useAdminEmail && form.businessEmail && !/^\S+@\S+\.\S+$/.test(form.businessEmail))
        err.businessEmail = "Invalid email address";
      if (!form.businessType) err.businessType = "Required";
      if (form.businessType === "Others" && !form.customBusinessType) 
        err.customBusinessType = "Please specify business type";
      if (!form.region) err.region = "Required";
      if (!form.province) err.province = "Required";
      if (!form.city) err.city = "Required";
      if (!form.barangay) err.barangay = "Required";
    }
    if (step === 3) {
      if (!form.documents || form.documents.length === 0) {
        err.documents = "Please upload at least one business document";
      }
      if (form.documents.length !== form.documentTypes.length) {
        err.documentTypes = "Please specify document type for each uploaded file";
      }
    }
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleNext = async () => {
    if (!validateStep()) return;

    if (step === 0) {
      setLoading(true);
      try {
        await api("/otp/send", {
          method: "POST",
          body: JSON.stringify({ email: form.email }),
        });
        setStep((s) => s + 1);
      } catch (err) {
        setErrors({ email: err.message || "Failed to send OTP" });
      } finally {
        setLoading(false);
      }
    } else if (step === 1) {
      setLoading(true);
      try {
        await api("/otp/verify", {
          method: "POST",
          body: JSON.stringify({ email: form.email, otp: form.otp }),
        });
        setIsOtpVerified(true);
        setStep((s) => s + 1);
      } catch (err) {
        setErrors({ otp: err.message || "Failed to verify OTP" });
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
      // Register business with documents in one transaction
      const formData = new FormData();

      // Add business registration fields
      formData.append('email', form.email);
      formData.append('username', form.username);
      formData.append('businessName', form.businessName);
      formData.append('businessType', form.businessType === "Others" ? form.customBusinessType : form.businessType);
      formData.append('country', 'Philippines');
      formData.append('countryName', 'Philippines');
      formData.append('province', form.province);
      formData.append('city', form.city);
      formData.append('barangay', form.barangay);
      formData.append('regionName', form.regionName);
      formData.append('provinceName', form.provinceName);
      formData.append('cityName', form.cityName);
      formData.append('barangayName', form.barangayName);
      formData.append('houseNumber', form.houseNumber);
      formData.append('mobile', form.mobile);
      formData.append('password', form.password);

      // Add document types
      formData.append('document_types', JSON.stringify(form.documentTypes));

      // Add documents
      form.documents.forEach((file) => {
        formData.append('documents', file);
      });

      const result = await api("/business/register-with-documents", {
        method: "POST",
        body: formData,
      });

      localStorage.setItem("token", result.token);
      localStorage.setItem("user", JSON.stringify(result.user));
      setSuccess(true);

    } catch (err) {
      setErrors({ general: err.message || "An error occurred." });
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
    loading,
    setLoading,
    success,
    isOtpVerified,
    setIsOtpVerified,
    inputRef,
    handleChange,
    handleLocationChange,
    validateStep,
    handleNext,
    handleBack,
    handleFinish,
    progress,
  };
}
