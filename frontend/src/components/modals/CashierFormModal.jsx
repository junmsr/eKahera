import React, { useState } from "react";
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
  initialData = {
    name: "",
    password: "",
    number: "",
    email: "",
    status: "ACTIVE",
  },
  isLoading = false,
}) {
  const [form, setForm] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Validation rules
  const validateField = (name, value) => {
    const newErrors = { ...errors };

    switch (name) {
      case "name":
        if (!value.trim()) {
          newErrors.name = "Name is required";
        } else if (value.trim().length < 2) {
          newErrors.name = "Name must be at least 2 characters";
        } else {
          delete newErrors.name;
        }
        break;

      case "password":
        if (!value) {
          newErrors.password = "Password is required";
        } else if (value.length < 6) {
          newErrors.password = "Password must be at least 6 characters";
        } else {
          delete newErrors.password;
        }
        break;

      case "number":
        if (!value.trim()) {
          newErrors.number = "Phone number is required";
        } else if (!/^\d+$/.test(value.trim())) {
          newErrors.number = "Phone number must contain only digits";
        } else if (value.trim().length !== 11) {
          newErrors.number = "Phone number must be exactly 11 digits";
        } else {
          delete newErrors.number;
        }
        break;

      case "email":
        if (!value.trim()) {
          newErrors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
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

    // Validate all fields
    Object.keys(form).forEach((key) => {
      if (key !== "status") {
        validateField(key, form[key]);
      }
    });

    // Check if form is valid
    const hasErrors = Object.keys(errors).length > 0;
    if (!hasErrors) {
      await onSubmit(form);
      handleClose();
    }
  };

  const handleClose = () => {
    setForm(initialData);
    setErrors({});
    setTouched({});
    onClose();
  };

  if (!isOpen) return null;

  const isFormValid =
    Object.keys(errors).length === 0 &&
    form.name.trim() &&
    form.password &&
    form.number.trim() &&
    form.email.trim();

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
        {/* Name Field */}
        <FormField
          label="Full Name"
          name="name"
          value={form.name}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Enter cashier name"
          error={touched.name && errors.name ? errors.name : null}
          required
        />

        {/* Password Field */}
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
          placeholder="Enter email address"
          error={touched.email && errors.email ? errors.email : null}
          required
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
