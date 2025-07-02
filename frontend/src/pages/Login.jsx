import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Card from "../components/Card";
import Input from "../components/Input";
import Button from "../components/Button";
import Loader from "../components/Loader";
import Modal from "../components/Modal";      
import SectionHeader from "../components/SectionHeader";
import Logo from "../components/Logo";

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
    let err = {};
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-50 to-white">
      <div className="flex flex-1 items-center justify-center py-16 px-2">
        <Card variant="shadow" className="w-full max-w-3xl flex flex-col md:flex-row overflow-hidden p-0 md:p-0 animate-fadeIn border border-white/40 z-10">
          {/* Left: Illustration/Branding */}
          <div className="hidden md:flex flex-col justify-center items-center bg-gradient-to-br from-purple-500 to-purple-400 w-1/2 p-12 gap-6">
            <Logo size={56} />
            <SectionHeader className="text-white mb-2 mt-8 text-3xl md:text-4xl drop-shadow-lg">Welcome back!</SectionHeader>
            <p className="text-white/90 text-center text-lg max-w-xs font-medium">Please log in to access your account.</p>
          </div>
          {/* Right: Login Form */}
          <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-8 md:p-12 bg-white">
            <SectionHeader className="mb-8 text-purple-700 text-2xl md:text-3xl">
              {searchParams.get("role") === "admin" ? "Admin Login" : "Cashier Login"}
            </SectionHeader>
            <form onSubmit={handleSubmit} className="w-full max-w-xs flex flex-col gap-6">
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
                  className="absolute right-3 top-2 text-xs"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </Button>
              </div>
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                className="w-full flex items-center justify-center h-11 mt-2 text-lg"
              >
                {loading ? <Loader className="mr-2" size="sm" /> : null}
                {loading ? "Logging in..." : "Login"}
              </Button>
            </form>
          </div>
        </Card>
      </div>
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Notice">Modal content here</Modal>
      <style>{`
        .animate-fadeIn {
          animation: fadeIn 0.5s;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
