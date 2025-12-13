import React, { useState, useEffect } from "react";
import Button from "../common/Button";
import FormField from "../common/FormField";
import BaseModal from "./BaseModal";

/**
 * CashierFormModal Component
 * Clean minimalist modal matching inventory product modal UI/UX
 */
export default function CashierFormModal({
  isOpen,
  onClose,
  onSubmit,
  title = "Add Cashier",
  submitButtonText = "Save",
  initialData,
  isLoading = false,
}) {
  const defaultInitialData = {
    name: "",
    first_name: "",
    last_name: "",
    password: "",
    number: "",
    email: "",
    status: "ACTIVE",
  };

  const [form, setForm] = useState(initialData || defaultInitialData);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  // Check if we're in edit mode (initialData exists and has an id)
  const isEditMode = initialData && initialData.id;

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || initialData.username || "",
        first_name: initialData.first_name || "",
        last_name: initialData.last_name || "",
        password: initialData.password || "",
        number: initialData.number || initialData.contact_number || "",
        email: initialData.email || "",
        status: initialData.status || "ACTIVE",
      });
    } else {
      // When used for "Add", there's no initialData, so we use the default.
      setForm(defaultInitialData);
    }
  }, [initialData]);

  // Reset form state when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setForm(defaultInitialData);
      setErrors({});
      setTouched({});
    }
  }, [isOpen, initialData]);

  // Validation rules
  const validateField = (name, value) => {
    const newErrors = { ...errors };

    switch (name) {
      case "name":
        if (!value || !value.trim()) {
          newErrors.name = "Username is required";
        } else if (value.trim().length < 2) {
          newErrors.name = "Username must be at least 2 characters";
        } else {
          delete newErrors.name;
        }
        break;

      case "first_name":
        if (!value || !value.trim()) {
          newErrors.first_name = "First name is required";
        } else if (value.trim().length < 2) {
          newErrors.first_name = "First name must be at least 2 characters";
        } else {
          delete newErrors.first_name;
        }
        break;

      case "last_name":
        if (!value || !value.trim()) {
          newErrors.last_name = "Last name is required";
        } else if (value.trim().length < 2) {
          newErrors.last_name = "Last name must be at least 2 characters";
        } else {
          delete newErrors.last_name;
        }
        break;

      case "password":
        // Password is only required when adding, optional when editing
        if (!isEditMode && (!value || !value.trim())) {
          newErrors.password = "Password is required";
        } else if (value && value.length < 6) {
          newErrors.password = "Password must be at least 6 characters";
        } else {
          delete newErrors.password;
        }
        break;

      case "number":
        if (!value || !value.trim()) {
          newErrors.number = "Phone number is required";
        } else if (value.trim().length < 7) {
          newErrors.number = "Phone number must be at least 7 digits";
        } else {
          delete newErrors.number;
        }
        break;

      case "email":
        if (value && value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          newErrors.email = "Please enter a valid email";
        } else {
          delete newErrors.email;
        }
        break;

      default:
        break;
    }

    setErrors(newErrors);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (touched[name]) {
      validateField(name, value);
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all fields and compute errors synchronously
    const newErrors = {};
    Object.keys(form).forEach((key) => {
      if (key !== "status") {
        const value = form[key];
        switch (key) {
          case "name":
            if (!value || !value.trim()) {
              newErrors.name = "Username is required";
            } else if (value.trim().length < 2) {
              newErrors.name = "Username must be at least 2 characters";
            }
            break;
          case "first_name":
            if (!value || !value.trim()) {
              newErrors.first_name = "First name is required";
            } else if (value.trim().length < 2) {
              newErrors.first_name = "First name must be at least 2 characters";
            }
            break;
          case "last_name":
            if (!value || !value.trim()) {
              newErrors.last_name = "Last name is required";
            } else if (value.trim().length < 2) {
              newErrors.last_name = "Last name must be at least 2 characters";
            }
            break;
          case "password":
            // Password is only required when adding, optional when editing
            if (!isEditMode && !value) {
              newErrors.password = "Password is required";
            } else if (value && value.length < 6) {
              newErrors.password = "Password must be at least 6 characters";
            }
            break;
          case "number":
            if (!value || !value.trim()) {
              newErrors.number = "Phone number is required";
            } else if (value.trim().length < 7) {
              newErrors.number = "Phone number must be at least 7 digits";
            }
            break;
          case "email":
            if (value && value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
              newErrors.email = "Please enter a valid email";
            }
            break;
          default:
            break;
        }
      }
    });

    // Update errors state
    setErrors(newErrors);
    setTouched({
      name: true,
      first_name: true,
      last_name: true,
      ...(!isEditMode && { password: true }), // Only mark password as touched when adding
      number: true,
      email: true,
    });

    // Check if form is valid
    const hasErrors = Object.keys(newErrors).length > 0;
    if (!hasErrors) {
      // Remove password field when editing (it's not shown in edit mode)
      const formDataToSubmit = isEditMode 
        ? { ...form }
        : form;
      
      // Remove password from edit submissions
      if (isEditMode && formDataToSubmit.password) {
        delete formDataToSubmit.password;
      }
      
      await onSubmit(formDataToSubmit);
      handleClose();
    }
  };

  const handleClose = () => {
    setForm(initialData || defaultInitialData);
    setErrors({});
    setTouched({});
    onClose();
  };

  if (!isOpen) return null;

  const isFormValid =
    Object.keys(errors).length === 0 &&
    form.name && form.name.trim() &&
    form.first_name && form.first_name.trim() &&
    form.last_name && form.last_name.trim() &&
    (!isEditMode ? form.password : true) && // Password only required when adding
    form.number && form.number.trim();

  const footerContent = (
    <>
      <Button
        label="Cancel"
        variant="secondary"
        onClick={handleClose}
        type="button"
        disabled={isLoading}
      />
      <Button
        label={submitButtonText}
        variant="primary"
        type="submit"
        onClick={handleSubmit}
        disabled={!isFormValid || isLoading}
      />
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      subtitle="Please fill in all required fields"
      icon={
        <svg
          className="w-5 h-5 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 10H9m6 0a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      }
      footer={footerContent}
      disabled={isLoading}
      size="md"
      contentClassName="space-y-4"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Username Field */}
        <FormField
          label="Username"
          name="name"
          value={form.name}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Enter username"
          error={touched.name && errors.name ? errors.name : null}
          required
        />

        {/* First Name Field */}
        <FormField
          label="First Name"
          name="first_name"
          value={form.first_name}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Enter first name"
          error={touched.first_name && errors.first_name ? errors.first_name : null}
          required
        />

        {/* Last Name Field */}
        <FormField
          label="Last Name"
          name="last_name"
          value={form.last_name}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Enter last name"
          error={touched.last_name && errors.last_name ? errors.last_name : null}
          required
        />

        {/* Password Field - Only show when adding, not when editing */}
        {!isEditMode && (
          <FormField
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Min. 6 characters"
            error={touched.password && errors.password ? errors.password : null}
            required
          />
        )}

        {/* Phone Number Field */}
        <FormField
          label="Phone Number"
          name="number"
          value={form.number}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Enter phone number"
          error={touched.number && errors.number ? errors.number : null}
          required
        />

        {/* Email Field */}
        <FormField
          label="Email Address"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Enter email address (optional)"
          error={touched.email && errors.email ? errors.email : null}
        />

        {/* Status Field */}
        <div>
          <label className="block mb-1 text-sm text-gray-700 font-medium">
            Status <span className="text-red-500">*</span>
          </label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </form>
    </BaseModal>
  );
}
