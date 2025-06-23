import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

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
    // TODO: Implement actual login logic here
    setTimeout(() => {
      setLoading(false);
      navigate("/dashboard");
    }, 1500);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden px-2 py-8 mt-28">
      <div className="w-full max-w-4xl bg-white backdrop-blur-lg rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden animate-fadeIn border border-white/40 z-10">
        {/* Left: Illustration/Branding */}
        <div className="hidden md:flex flex-col justify-center items-center bg-purple-500 w-1/2 p-10 relative">
          <div className="absolute top-6 left-6 flex items-center gap-2">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md">
              <span className="text-purple-600 font-bold text-lg">eK</span>
            </div>
            <span className="text-white text-2xl font-bold tracking-wide">
              eKahera
            </span>
          </div>
          <h3 className="text-white text-2xl font-semibold text-center mt-4">
            Welcome back!
          </h3>
          <p className="text-white/80 text-center mt-2">
            Please log in to access your account.
          </p>
        </div>

        {/* Right: Login Form */}
        <div className="w-full md:w-1/2 p-8 flex flex-col justify-center bg-transparent">
          <h2 className="text-2xl font-bold mb-6 text-center tracking-tight">
            {searchParams.get("role") === "admin" ? "Admin Login" : "Cashier Login"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1 font-medium">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 text-lg ${
                  errors.email
                    ? "border-red-400 ring-red-200"
                    : "border-gray-300 focus:ring-blue-200"
                }`}
                placeholder="Enter your email address"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            <div className="relative">
              <label className="block mb-1 font-medium">Password</label>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 text-lg ${
                  errors.password
                    ? "border-red-400 ring-red-200"
                    : "border-gray-300 focus:ring-blue-200"
                }`}
                placeholder="Enter password"
              />
              <button
                type="button"
                className="absolute right-3 top-9 text-xs text-gray-500 hover:text-blue-600 transition"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 font-medium transition flex items-center justify-center h-11"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loader mr-2"></span>
                  <span>Logging in...</span>
                </>
              ) : (
                "Login"
              )}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        .loader {
          border: 2px solid #f3f3f3;
          border-top: 2px solid #ffffff;
          border-radius: 50%;
          width: 18px;
          height: 18px;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
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
