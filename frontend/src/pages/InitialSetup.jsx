import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

// Components
import Background from "../components/layout/Background";
import Card from "../components/common/Card";
import Logo from "../components/common/Logo";
import SectionHeader from "../components/layout/SectionHeader";
import Input from "../components/common/Input";
import PasswordInput from "../components/common/PasswordInput";
import Button from "../components/common/Button";
import Loader from "../components/common/Loader";

/**
 * Initial Setup Page Component
 * Creates the first SuperAdmin account for the system
 */
export default function InitialSetup() {
  const navigate = useNavigate();

  // Form state
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [success, setSuccess] = useState(false);

  // Password strength indicators
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });

  // Form handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }

    // Update password strength indicators
    if (name === "password") {
      setPasswordStrength({
        length: value.length >= 8,
        uppercase: /[A-Z]/.test(value),
        lowercase: /[a-z]/.test(value),
        number: /\d/.test(value),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(value),
      });
    }
  };

  // Validation
  const validateForm = () => {
    const err = {};

    if (!form.name.trim()) {
      err.name = "Full name is required";
    }

    if (!form.email.trim()) {
      err.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      err.email = "Please enter a valid email address";
    }

    if (!form.password) {
      err.password = "Password is required";
    } else if (form.password.length < 8) {
      err.password = "Password must be at least 8 characters long";
    } else if (!Object.values(passwordStrength).every(Boolean)) {
      err.password = "Password does not meet security requirements";
    }

    if (!form.confirmPassword) {
      err.confirmPassword = "Please confirm your password";
    } else if (form.password !== form.confirmPassword) {
      err.confirmPassword = "Passwords do not match";
    }

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    setApiError("");
    
    try {
      const response = await api("/api/auth/setup/superadmin", {
        method: "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          confirmPassword: form.confirmPassword,
        }),
      });

      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login?role=admin&setup=complete");
      }, 3000);
      
    } catch (err) {
      setApiError(err.message || "Setup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Success state
  if (success) {
    return (
      <Background variant="gradientGreen" pattern="dots" overlay floatingElements>
        <main className="flex h-screen items-center justify-center px-2 relative z-10">
          <Card variant="glass" className="w-full max-w-md p-8 text-center animate-fadeIn">
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <SectionHeader variant="light" size="lg" className="mb-4">
                Setup Complete!
              </SectionHeader>
              <p className="text-gray-600 mb-4">
                Your SuperAdmin account has been created successfully.
              </p>
              <p className="text-sm text-gray-500">
                Redirecting to login page...
              </p>
            </div>
            <Loader size="sm" />
          </Card>
        </main>
      </Background>
    );
  }

  return (
    <Background variant="gradientBlue" pattern="dots" overlay floatingElements>
      <main className="flex h-screen items-center justify-center px-2 relative z-10 overflow-hidden">
        <Card
          variant="glass"
          className="w-full max-w-4xl flex flex-col md:flex-row overflow-hidden p-0 animate-fadeIn"
        >
          {/* Left: Information Panel */}
          <aside className="hidden md:flex flex-col justify-center items-center bg-gradient-to-br from-blue-500 via-blue-300 to-blue-500 w-1/2 p-15 gap-6 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 -z-10 pointer-events-none">
              <div className="w-full h-full bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.3)_1px,transparent_0)] bg-[length:20px_20px]" />
            </div>

            <div className="relative z-10 flex flex-col items-center">
              <SectionHeader
                variant="white"
                size="xl"
                className="mb-4 mt-4 text-center"
              >
                <Logo size={64} className="mb-10" />
                Initial Setup
              </SectionHeader>
              <p className="text-white/90 text-center text-lg max-w-xs font-medium leading-relaxed mb-4">
                Welcome to eKahera! Let's create your SuperAdmin account to get started.
              </p>
              <div className="text-white/80 text-sm space-y-2">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Full system access</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Manage all stores</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Advanced analytics</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Right: Setup Form Panel */}
          <section className="w-full md:w-1/2 flex flex-col justify-center items-center p-8 md:p-12 bg-white/95 backdrop-blur-sm">
            <div className="w-full max-w-sm">
              <SectionHeader
                variant="light"
                size="lg"
                className="mb-8 text-center"
              >
                Create SuperAdmin
              </SectionHeader>

              <form
                onSubmit={handleSubmit}
                className="w-full flex flex-col gap-6"
                noValidate
              >
                <Input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  type="text"
                  error={errors.name}
                  autoComplete="name"
                  required
                />

                <Input
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter your email address"
                  type="email"
                  error={errors.email}
                  autoComplete="email"
                  required
                />

                <div className="space-y-2">
                  <PasswordInput
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Create a strong password"
                    error={errors.password}
                    autoComplete="new-password"
                    required
                  />
                  
                  {/* Password Strength Indicators */}
                  {form.password && (
                    <div className="space-y-1 text-xs">
                      <div className="text-gray-600 font-medium">Password Requirements:</div>
                      <div className="grid grid-cols-2 gap-1">
                        <div className={`flex items-center gap-1 ${passwordStrength.length ? 'text-green-600' : 'text-gray-400'}`}>
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span>8+ chars</span>
                        </div>
                        <div className={`flex items-center gap-1 ${passwordStrength.uppercase ? 'text-green-600' : 'text-gray-400'}`}>
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span>Uppercase</span>
                        </div>
                        <div className={`flex items-center gap-1 ${passwordStrength.lowercase ? 'text-green-600' : 'text-gray-400'}`}>
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span>Lowercase</span>
                        </div>
                        <div className={`flex items-center gap-1 ${passwordStrength.number ? 'text-green-600' : 'text-gray-400'}`}>
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span>Number</span>
                        </div>
                        <div className={`flex items-center gap-1 ${passwordStrength.special ? 'text-green-600' : 'text-gray-400'}`}>
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span>Special (!@#$)</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <PasswordInput
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  error={errors.confirmPassword}
                  autoComplete="new-password"
                  required
                />

                {apiError && (
                  <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-3 flex items-start gap-2">
                    <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <p className="text-sm font-medium text-red-700">
                      {apiError.replace(/^\{|\}$/g, '')}
                    </p>
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading || !Object.values(passwordStrength).every(Boolean)}
                  className="w-full flex items-center justify-center h-12 mt-4 text-lg font-medium transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading && <Loader size="sm" className="mr-2" />}
                  {loading ? "Creating Account..." : "Create SuperAdmin Account"}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-500 text-sm">
                  This account will have full system access
                </p>
              </div>
            </div>
          </section>
        </Card>
      </main>

      {/* Page lock style */}
      <style>{`
        html, body, #root {
          height: 100%;
          margin: 0;
          padding: 0;
          overflow: hidden; /* No scroll */
        }
      `}</style>
    </Background>
  );
}
