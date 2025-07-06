import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Background from "../components/Background";
import Card from "../components/Card";
import Logo from "../components/Logo";
import SectionHeader from "../components/SectionHeader";
import Input from "../components/Input";
import Button from "../components/Button";
import Loader from "../components/Loader";
import Modal from "../components/Modal";

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const validateForm = () => {
    const err = {};
    if (!form.email) err.email = "Required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) err.email = "Invalid email address";
    if (!form.password) err.password = "Required";
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate("/dashboard");
    }, 1500);
  };

  return (
    <Background variant="gradientPurple" pattern="dots" overlay floatingElements>
      <main className="flex flex-1 items-center justify-center py-16 px-2 relative z-10 mt-24">
        <Card variant="shadow" className="w-full max-w-4xl flex flex-col md:flex-row overflow-hidden p-0 animate-fadeIn border border-white/60 backdrop-blur-sm bg-white/95 shadow-2xl">
          {/* Left: Branding Panel */}
          <aside className="hidden md:flex flex-col justify-center items-center bg-gradient-to-br from-purple-600 via-purple-500 to-purple-400 w-1/2 p-12 gap-6 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 -z-10 pointer-events-none">
              <div className="w-full h-full bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.3)_1px,transparent_0)] bg-[length:20px_20px]" />
            </div>
            <div className="relative z-10 flex flex-col items-center">
              <Logo size={64} className="mb-6" />
              <SectionHeader className="text-white mb-4 mt-4 text-3xl md:text-4xl drop-shadow-lg text-center">
                Welcome back!
              </SectionHeader>
              <p className="text-white/90 text-center text-lg max-w-xs font-medium leading-relaxed">
                Please log in to access your account and manage your transactions.
              </p>
            </div>
          </aside>
          {/* Right: Login Form Panel */}
          <section className="w-full md:w-1/2 flex flex-col justify-center items-center p-8 md:p-12 bg-white/95 backdrop-blur-sm">
            <div className="w-full max-w-sm">
              <SectionHeader className="mb-8 text-purple-700 text-2xl md:text-3xl text-center">
                {searchParams.get("role") === "admin" ? "Admin Login" : "Cashier Login"}
              </SectionHeader>
              <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6" noValidate>
                <Input
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Email"
                  error={errors.email}
                  autoComplete="username"
                />
                <div className="relative">
                  <Input
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Password"
                    type={showPassword ? "text" : "password"}
                    error={errors.password}
                    autoComplete="current-password"
                  />
                  <Button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    variant="secondary"
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 bg-transparent border-none shadow-none hover:bg-purple-100 rounded-full transition-colors flex items-center justify-center"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      // Eye-off SVG
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 hover:text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.403-3.22 1.125-4.575m2.122-2.122A9.956 9.956 0 0112 3c5.523 0 10 4.477 10 10 0 1.657-.403 3.22-1.125 4.575m-2.122 2.122A9.956 9.956 0 0112 21c-2.21 0-4.267-.72-5.947-1.947m0 0L3 21m0 0l3-3" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    ) : (
                      // Eye SVG
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 hover:text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </Button>
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading}
                  className="w-full flex items-center justify-center h-12 mt-4 text-lg font-medium transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? <Loader className="mr-2" size="sm" /> : null}
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
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Notice">
        Modal content here
      </Modal>
      <style>{`
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </Background>
  );
}
