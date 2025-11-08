import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

// Components
import Background from "../components/layout/Background";
import Card from "../components/common/Card";
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
  // Navigation
  const navigate = useNavigate();

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
      sessionStorage.setItem('auth_token', token);
      sessionStorage.setItem('user', JSON.stringify(user));
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


  return (
    <Background variant="gradientBlue" pattern="dots" overlay floatingElements>
      {/* Gradient overlay per request */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50/30 to-purple-50/20 pointer-events-none" />

      {/* Animated background orbs */}
      <motion.div
        className="absolute -top-24 -left-24 w-[28rem] h-[28rem] rounded-full bg-gradient-to-br from-blue-400/15 to-cyan-400/10 blur-3xl"
        animate={{ scale: [1, 1.08, 1], opacity: [0.35, 0.5, 0.35] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 -right-24 w-[30rem] h-[30rem] rounded-full bg-gradient-to-bl from-indigo-400/15 to-purple-400/10 blur-3xl"
        animate={{ scale: [1, 1.12, 1], opacity: [0.3, 0.45, 0.3] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      <main className="flex h-screen items-center justify-center px-2 relative z-10 overflow-hidden">
        <Card
          variant="glass"
          className="w-full max-w-4xl flex flex-col md:flex-row overflow-hidden p-0 animate-fadeIn rounded-2xl shadow-xl"
        >
          {/* Left: Illustration / Branding Panel (modernized) */}
          <aside className="hidden md:flex items-center rounded-l-2xl bg-gradient-to-br from-indigo-500 via-blue-400 to-sky-400 w-1/2 p-10 relative overflow-hidden">
            <div className="absolute inset-0 opacity-7 -z-10 pointer-events-none">
              <div className="w-full h-full bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.25)_1px,transparent_0)] bg-[length:24px_24px]" />
            </div>

            <div className="relative z-10 flex flex-col justify-center items-start max-w-sm pl-6">
              <h2 className="text-white font-extrabold text-3xl leading-tight mb-3">
                Welcome back!
              </h2>
              <p className="text-white/90 text-base max-w-xs mb-6">
                Sign in to continue managing transactions, inventory and sales
                from anywhere.
              </p>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 text-white/90 px-3 py-1 text-xs backdrop-blur-sm ring-1 ring-white/20">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
                Secure area • eKahera
              </div>
              {/* Illustration removed per request */}
            </div>
          </aside>

          {/* Right: Login Form Panel */}
          <section className="w-full md:w-1/2 flex flex-col justify-center items-center p-6 md:p-12 bg-white/90 backdrop-blur-xl">
            <div className="w-full max-w-md">
              <div className="flex flex-col items-center mb-6">
                <SectionHeader
                  variant="primary"
                  size="lg"
                  className="text-center"
                >
                  Log In
                </SectionHeader>
                <p className="text-gray-500 text-sm mt-2">
                  Enter your credentials to access your account
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                className="w-full flex flex-col gap-4"
                noValidate
              >
                <Input
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Email or username"
                  type="text"
                  error={errors.email}
                  autoComplete="username"
                  required
                />

                <div className="relative">
                  <PasswordInput
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Password"
                    error={errors.password}
                    autoComplete="current-password"
                    required
                    className="pr-12"
                  />
                </div>

                

                <div className="flex items-center justify-end mt-1">
                  <div className="text-sm text-gray-500">
                    Need an account?{" "}
                    <Link
                      to="/get-started"
                      className="text-blue-600 hover:underline"
                    >
                      Get started
                    </Link>
                  </div>
                </div>

                {apiError && (
                  <div className="text-red-600 text-sm">{apiError}</div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading}
                  className="w-full flex items-center justify-center h-12 mt-2 text-lg font-medium transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading && <Loader size="sm" className="mr-2" />}
                  {loading ? "Logging in..." : "Login"}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="mt-6 text-gray-400 text-xs">
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
