import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Background from "../components/layout/Background";
import Card from "../components/common/Card";
import SectionHeader from "../components/layout/SectionHeader";
import Input from "../components/common/Input";
import PasswordInput from "../components/common/PasswordInput";
import Button from "../components/common/Button";
import Loader from "../components/common/Loader";
import { api } from "../lib/api";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState("request"); // request | reset
  const [form, setForm] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  const updateField = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
    setStatus("");
  };

  const requestReset = async (e) => {
    e.preventDefault();
    if (!form.email) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    setError("");
    setStatus("");
    try {
      // First, verify the email exists
      await api("/api/auth/forgot-password/check", {
        method: "POST",
        body: JSON.stringify({ email: form.email }),
      });

      // Then send the reset code
      await api("/api/auth/forgot-password/request", {
        method: "POST",
        body: JSON.stringify({ email: form.email }),
      });

      setStep("reset");
      setStatus("Reset code sent to your email.");
    } catch (err) {
      setError(err.message || "Failed to start password reset.");
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    if (!form.email) {
      setError("Enter your email first to resend the code.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await api("/otp/resend", {
        method: "POST",
        body: JSON.stringify({ email: form.email, purpose: "password_reset" }),
      });
      setStatus("A new code was sent (if the email exists).");
    } catch (err) {
      setError(err.message || "Failed to resend code.");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    if (!form.otp || form.otp.length < 4) {
      setError("Enter the 4-character code sent to your email.");
      return;
    }
    if (!form.newPassword) {
      setError("Please enter a new password.");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await api("/api/auth/forgot-password/reset", {
        method: "POST",
        body: JSON.stringify({
          email: form.email,
          otp: form.otp,
          newPassword: form.newPassword,
        }),
      });
      setStatus("Password updated. Redirecting to login...");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError(err.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Background variant="gradientBlue" pattern="dots" overlay floatingElements>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50/30 to-purple-50/20 pointer-events-none" />
      <main className="flex h-screen items-center justify-center px-2 relative z-10 overflow-hidden">
        <Card
          variant="glass"
          className="w-full max-w-3xl flex flex-col md:flex-row overflow-hidden p-0 animate-fadeIn rounded-2xl shadow-xl"
        >
          <section className="w-full md:w-1/2 flex flex-col justify-center items-center p-6 md:p-10 rounded-l-2xl bg-white/90 backdrop-blur-xl">
            <div className="w-full max-w-md space-y-6">
              <div className="flex items-center justify-between text-sm">
                <Link to="/" className="text-gray-600 hover:text-gray-800 inline-flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to home
                </Link>
                <Link to="/login" className="text-blue-600 hover:underline">
                  Back to login
                </Link>
              </div>

              <div className="space-y-2 text-center">
                <SectionHeader variant="primary" size="lg" className="text-center">
                  Forgot Password
                </SectionHeader>
                <p className="text-gray-500 text-sm">
                  Enter your email to receive a one-time code, then set a new password.
                </p>
              </div>

              <form
                onSubmit={step === "request" ? requestReset : resetPassword}
                className="w-full flex flex-col gap-4"
                noValidate
              >
                <Input
                  name="email"
                  value={form.email}
                  onChange={updateField}
                  placeholder="Email address"
                  type="email"
                  required
                />

                {step === "reset" && (
                  <>
                    <Input
                      name="otp"
                      value={form.otp}
                      onChange={(e) =>
                        updateField({
                          target: { name: "otp", value: e.target.value.slice(0, 4) },
                        })
                      }
                      placeholder="4-character code"
                      type="text"
                      maxLength={4}
                      required
                    />
                    <PasswordInput
                      name="newPassword"
                      value={form.newPassword}
                      onChange={updateField}
                      placeholder="New password"
                      required
                    />
                    <PasswordInput
                      name="confirmPassword"
                      value={form.confirmPassword}
                      onChange={updateField}
                      placeholder="Confirm new password"
                      required
                    />
                    <p className="text-xs text-gray-500">
                      Password must be at least 12 characters and include uppercase, lowercase, number, and special character.
                    </p>
                  </>
                )}

                {error && (
                  <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-3 text-sm text-red-700">
                    {error}
                  </div>
                )}
                {status && (
                  <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-3 text-sm text-green-700">
                    {status}
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading}
                  className="w-full flex items-center justify-center h-12 mt-2 text-lg font-medium transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading && <Loader size="sm" className="mr-2" />}
                  {step === "request" ? "Send Reset Code" : "Reset Password"}
                </Button>
              </form>

              {step === "reset" && (
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <button
                    type="button"
                    onClick={resendCode}
                    disabled={loading}
                    className="text-blue-600 hover:underline disabled:opacity-60"
                  >
                    Resend code
                  </button>
                  <span>Didn&apos;t get the email? Check spam too.</span>
                </div>
              )}
            </div>
          </section>

          <aside className="hidden md:flex items-center rounded-r-2xl bg-gradient-to-br from-indigo-500 via-blue-400 to-sky-400 w-1/2 p-10 relative overflow-hidden">
            <div className="absolute inset-0 opacity-7 -z-10 pointer-events-none">
              <div className="w-full h-full bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.25)_1px,transparent_0)] bg-[length:24px_24px]" />
            </div>
            <div className="relative z-10 flex flex-col justify-center items-start max-w-sm pl-6 space-y-3 text-white">
              <h2 className="text-3xl font-extrabold leading-tight">Secure account recovery</h2>
              <p className="text-white/90 text-base">
                Use your email to receive a one-time code and safely choose a new password.
              </p>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 text-white/90 px-3 py-1 text-xs backdrop-blur-sm ring-1 ring-white/20">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
                OTP protected
              </div>
            </div>
          </aside>
        </Card>
      </main>
    </Background>
  );
}

