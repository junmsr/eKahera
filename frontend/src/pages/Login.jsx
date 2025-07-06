import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

// Components
import Background from "../components/Background";
import Card from "../components/Card";
import Logo from "../components/Logo";
import SectionHeader from "../components/SectionHeader";
import Input from "../components/Input";
import PasswordInput from "../components/PasswordInput";
import Button from "../components/Button";
import Loader from "../components/Loader";

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
    password: "" 
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

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
      err.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      err.email = "Please enter a valid email address";
    }
    
    if (!form.password) {
      err.password = "Password is required";
    }
    
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  // Form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      navigate("/dashboard");
    }, 1500);
  };

  // Determine login type
  const isAdminLogin = searchParams.get("role") === "admin";
  const loginTitle = isAdminLogin ? "Admin Login" : "Cashier Login";

  return (
    <Background variant="gradientPurple" pattern="dots" overlay floatingElements>
      <main className="flex flex-1 items-center justify-center py-16 px-2 relative z-10 mt-24">
        <Card 
          variant="glass" 
          className="w-full max-w-4xl flex flex-col md:flex-row overflow-hidden p-0 animate-fadeIn"
        >
          {/* Left: Branding Panel */}
          <aside className="hidden md:flex flex-col justify-center items-center bg-gradient-to-br from-purple-600 via-purple-500 to-purple-400 w-1/2 p-12 gap-6 relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10 -z-10 pointer-events-none">
              <div className="w-full h-full bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.3)_1px,transparent_0)] bg-[length:20px_20px]" />
            </div>
            
            {/* Content */}
            <div className="relative z-10 flex flex-col items-center">
              <Logo size={64} className="mb-6" />
              <SectionHeader 
                variant="white" 
                size="xl" 
                className="mb-4 mt-4 text-center"
              >
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
              <SectionHeader 
                variant="dark" 
                size="lg" 
                className="mb-8 text-center"
              >
                {loginTitle}
              </SectionHeader>
              
              <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6" noValidate>
                {/* Email Input */}
                <Input
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  type="email"
                  error={errors.email}
                  autoComplete="username"
                  required
                />
                
                {/* Password Input */}
                <PasswordInput
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  error={errors.password}
                  autoComplete="current-password"
                  required
                />
                
                {/* Submit Button */}
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
              
              {/* Footer */}
              <div className="mt-6 text-center">
                <p className="text-gray-500 text-sm">
                  Secure login powered by eKahera
                </p>
              </div>
            </div>
          </section>
        </Card>
      </main>
      
      {/* Animations */}
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
