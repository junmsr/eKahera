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
    }
  }, [step, isOtpVerified]);

  // Auto-verify OTP when 4 characters are entered
  useEffect(() => {
    if (step === 1 && form.otp.length === 4 && !isOtpVerified && !loading) {
      handleNext();
    }
  }, [form.otp, step, isOtpVerified, loading]);

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

  const validateEmail = (email) => {
    if (!email) return 'Required';
    if (!/^\S+@\S+\.\S+$/.test(email)) return 'Invalid email address';
    return null;
  };

  const validateUsername = (username) => {
    if (!username) return 'Required';
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return 'Username must be 3-20 characters (letters, numbers, underscores)';
    }
    return null;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Clear any existing error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    // Handle special cases
    if (name === 'useAdminEmail') {
      setForm((f) => ({ 
        ...f, 
        [name]: checked,
        businessEmail: checked ? f.email : ""
      }));
      return;
    }
    
    // Update form state
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    
    // Real-time validation for email and username
    if (name === 'email') {
      const emailError = validateEmail(value);
      if (emailError) {
        setErrors(prev => ({ ...prev, email: emailError }));
      }
    } else if (name === 'username') {
      const usernameError = validateUsername(value);
      if (usernameError) {
        setErrors(prev => ({ ...prev, username: usernameError }));
      }
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
        err.username = "Username must not contain a white space and requires a 3-20 characters";
      if (!form.mobile) err.mobile = "Required";
      else if (!/^\d{10,15}$/.test(form.mobile))
        err.mobile = "Invalid mobile number";
      if (!form.password) err.password = "Required";
      else if (form.password.length < 12) err.password = "Password must be at least 12 characters long";
      else if (!/[A-Z]/.test(form.password)) err.password = "Password must contain at least one uppercase letter";
      else if (!/[a-z]/.test(form.password)) err.password = "Password must contain at least one lowercase letter";
      else if (!/\d/.test(form.password)) err.password = "Password must contain at least one number";
      else if (!/[!@#$%^&*(),.?":{}|<>]/.test(form.password)) err.password = "Password must contain at least one special character";
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
      const requiredDocuments = [
        'Business Registration Certificate (DTI/SEC/CDA)',
        "Mayor's Permit / Business Permit",
        'BIR Certificate of Registration (Form 2303)'
      ];

      if (!form.documents || form.documents.length === 0) {
        err.documents = "Please upload at least one business document";
      }

      if (form.documents.length !== form.documentTypes.length) {
        err.documentTypes = "Please specify document type for each uploaded file";
      }

      // Check if all required documents are uploaded
      const uploadedTypes = form.documentTypes.filter(type => type);
      const missingRequired = requiredDocuments.filter(req => !uploadedTypes.includes(req));
      if (missingRequired.length > 0) {
        err.documents = `Missing required documents: ${missingRequired.join(', ')}`;
      }

      // Ensure no duplicate document types
      const typeCounts = {};
      form.documentTypes.forEach(type => {
        if (type) typeCounts[type] = (typeCounts[type] || 0) + 1;
      });
      const duplicates = Object.keys(typeCounts).filter(type => typeCounts[type] > 1);
      if (duplicates.length > 0) {
        err.documentTypes = `Duplicate document types not allowed: ${duplicates.join(', ')}`;
      }

      if (!form.acceptTerms) {
        err.accept = "You must accept the Terms and Conditions.";
      } else if (!form.acceptPrivacy) {
        err.accept = "You must acknowledge the Privacy Policy.";
      }
    }
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const checkExistingUser = async (email, username) => {
    try {
      const response = await api("/auth/check-existing", {
        method: "POST",
        body: JSON.stringify({ email, username }),
      });
      return response; // Returns { exists: boolean, field: 'email'|'username'|null, message: string }
    } catch (error) {
      console.error('Error checking existing user:', error);
      // If there's a structured error response, throw it as is
      if (error.data) {
        throw error;
      }
      // Otherwise create a generic error
      throw new Error('Failed to check user availability. Please try again.');
    }
  };

  const handleNext = async () => {
    if (!validateStep()) return;

    if (step === 0) {
      setLoading(true);
      try {
        // First check if username or email already exists
        const existingUser = await checkExistingUser(form.email, form.username);
        
        if (existingUser.exists) {
          // If user exists, show appropriate error message
          const errorObj = {};
          if (existingUser.field === 'email') {
            errorObj.email = existingUser.message || 'This email is already registered. Please use a different email or log in.';
          } else if (existingUser.field === 'username') {
            errorObj.username = existingUser.message || 'This username is already taken. Please choose another one.';
          } else {
            errorObj.email = existingUser.message || 'This email or username is already registered.';
          }
          setErrors(errorObj);
          return;
        }

        // If no existing user, proceed with OTP
        await api("/otp/send", {
          method: "POST",
          body: JSON.stringify({ email: form.email }),
        });
        setStep((s) => s + 1);
      } catch (err) {
        console.error('Error in handleNext:', err);
        // Handle different types of errors
        if (err.status === 409) { // Conflict - user exists
          const errorData = err.data || {};
          const errorObj = {};
          
          if (errorData.field === 'email') {
            errorObj.email = errorData.message || 'This email is already registered.';
          } else if (errorData.field === 'username') {
            errorObj.username = errorData.message || 'This username is already taken.';
          } else {
            errorObj.email = errorData.message || 'This email or username is already registered.';
          }
          setErrors(errorObj);
        } else {
          // For other errors, show a generic message
          setErrors({ 
            email: err.message || 'Failed to verify account. Please try again.' 
          });
        }
      } finally {
        setLoading(false);
      }
    } else if (step === 1) {
      // If already verified, just proceed to next step
      if (isOtpVerified) {
        setStep((s) => s + 1);
        return;
      }

      setLoading(true);
      try {
        const response = await api("/otp/verify", {
          method: "POST",
          body: JSON.stringify({ email: form.email, otp: form.otp }),
        });
        setIsOtpVerified(true);
        setStep((s) => s + 1);
      } catch (err) {
        console.error('OTP verification error:', err);
        setErrors({ otp: err.message || "Failed to verify OTP" });
        setForm((f) => ({ ...f, otp: "" }));
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
