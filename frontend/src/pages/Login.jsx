import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
 * Login Page Component
 * Handles user authentication with email and password
 */
export default function Login() {
  // Navigation and URL params
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Form state
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  // Form handlers
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Clear error when user starts typing
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: "" });
    }
  };

  // Validation
  const validateForm = () => {
    const err = {};

    if (!form.email) {
      err.email = "Email or username is required";
    }

    if (!form.password) {
      err.password = "Password is required";
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
      const { token, user } = await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user', JSON.stringify(user));
      const role = (user?.role || '').toLowerCase();
      if (role === 'cashier') {
        navigate('/cashier-pos');
      } else if (role === 'superadmin') {
        navigate('/superadmin');
      } else if (role === 'admin') {
        navigate('/dashboard');
      } else {
        navigate("/");
      }
    } catch (err) {
      setApiError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // Determine login type
  const isAdminLogin = searchParams.get("role") === "admin";
  const loginTitle = isAdminLogin ? "Admin Login" : "Cashier Login";

  return (
    <Background variant="gradientBlue" pattern="dots" overlay floatingElements>
      <main className="flex h-screen items-center justify-center px-2 relative z-10 overflow-hidden">
        <Card
          variant="glass"
          className="w-full max-w-4xl flex flex-col md:flex-row overflow-hidden p-0 animate-fadeIn"
        >
          {/* Left: Branding Panel */}
          <aside className="hidden md:flex flex-col rounded-xl justify-center items-center bg-gradient-to-br from-blue-500 via-blue-300 to-blue-500 w-1/2 p-15 gap-6 relative overflow-hidden">
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
                Welcome back!
              </SectionHeader>
              <p className="text-white/90 text-center text-lg max-w-xs font-medium leading-relaxed">
                Please log in to access your account and manage your
                transactions.
              </p>
            </div>
          </aside>

          {/* Right: Login Form Panel */}
          <section className="w-full md:w-1/2 flex flex-col justify-center items-center p-8 md:p-12 bg-white/95 backdrop-blur-sm">
            <div className="w-full max-w-sm">
              <SectionHeader
                variant="light"
                size="lg"
                className="mb-8 text-center"
              >
                {loginTitle}
              </SectionHeader>

              <form
                onSubmit={handleSubmit}
                className="w-full flex flex-col gap-6"
                noValidate
              >
                <Input
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter your email or username"
                  type="text"
                  error={errors.email}
                  autoComplete="username"
                  required
                />

                <PasswordInput
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  error={errors.password}
                  autoComplete="current-password"
                  required
                />

                {apiError && (
                  <div className="text-red-600 text-sm">{apiError}</div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading}
                  className="w-full flex items-center justify-center h-12 mt-4 text-lg font-medium transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading && <Loader size="sm" className="mr-2" />}
                  {loading ? "Logging in..." : "Login"}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-500 text-sm">
                  Secure login powered by eKahera
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
