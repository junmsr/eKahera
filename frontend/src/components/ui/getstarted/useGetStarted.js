import { useEffect, useRef, useState } from "react";

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
    country: "Philippines",
    province: "",
    city: "",
    barangay: "",
    businessAddress: "",
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
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, [step]);

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
      if (!form.province) err.province = "Required";
      if (!form.city) err.city = "Required";
      if (!form.barangay) err.barangay = "Required";
      if (!form.businessAddress) err.businessAddress = "Required";
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
      // First register the business
      const businessResponse = await fetch(
        "http://localhost:5000/api/business/register",
        {
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
            businessAddress: form.businessAddress,
            houseNumber: form.houseNumber,
            mobile: form.mobile,
            password: form.password,
          }),
        }
      );
      
      if (businessResponse.ok) {
        const result = await businessResponse.json();
        const businessId = result.business.id;
        
        // Upload documents
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
          localStorage.setItem("token", result.token);
          localStorage.setItem("user", JSON.stringify(result.user));
          setSuccess(true);
        } else {
          const docError = await documentResponse.json();
          setErrors({ general: docError.error || "Document upload failed" });
        }
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
