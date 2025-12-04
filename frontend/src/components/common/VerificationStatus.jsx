import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  LogOut,
  ArrowRight,
} from "lucide-react";

// Mock API and auth hooks for demo
const api = async (url) => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return {
    verification: {
      verification_status: "approved", // Change to 'pending', 'rejected', 'approved' to test
      rejection_reason: "Business registration documents are unclear",
    },
  };
};

const useAuth = () => ({
  logout: () => console.log("Logout"),
});

const Button = ({ children, onClick, variant = "primary", className = "" }) => {
  const baseClasses =
    "px-6 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 justify-center";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 active:scale-95",
    outline:
      "border-2 border-blue-200 text-blue-700 hover:bg-blue-50 active:scale-95",
    ghost: "text-blue-600 hover:bg-blue-50 active:scale-95",
  };

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const Loader = () => (
  <div className="inline-block w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
);

export default function VerificationStatus({ user, onProceed }) {
  const [verificationData, setVerificationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tutorialCompleted, setTutorialCompleted] = useState(false);
  const { logout } = useAuth();

  useEffect(() => {
    const hasFetched = sessionStorage.getItem("verification_fetched");
    if (!hasFetched) {
      fetchVerificationStatus();
      sessionStorage.setItem("verification_fetched", "true");
    }
  }, []);

  const fetchVerificationStatus = async () => {
    try {
      setLoading(true);
      const data = await api("/documents/business/123");
      setVerificationData(data);
    } catch (err) {
      setError(err.message || "Failed to fetch verification status");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-50">
        <div className="text-center">
          <Loader />
          <p className="mt-6 text-slate-600 font-medium">Checking status...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-50 p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            Something went wrong
          </h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <Button onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const { verification } = verificationData;
  const status = verification?.verification_status || "not_submitted";

  // Approved Status
  if (status === "approved") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6">
        <div className="max-w-lg w-full">
          <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-10 text-center">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-blue-600" />
            </div>

            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              You're all set!
            </h1>
            <p className="text-slate-600 mb-8">
              Your business has been verified. Welcome to eKahera.
            </p>

            <div className="bg-blue-50 rounded-xl p-6 mb-8 text-left">
              <h3 className="font-semibold text-blue-900 mb-3 text-sm uppercase tracking-wide">
                Next Steps
              </h3>
              <ul className="space-y-2.5 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">•</span>
                  <span>Set up your product inventory</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">•</span>
                  <span>Configure your POS system</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">•</span>
                  <span>Add team members and cashiers</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">•</span>
                  <span>Start processing sales</span>
                </li>
              </ul>
            </div>

            <Button onClick={onProceed} className="w-full">
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Rejected Status
  if (status === "rejected") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-50 p-6">
        <div className="max-w-lg w-full">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-10 text-center">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-12 h-12 text-red-500" />
            </div>

            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Additional info needed
            </h2>
            <p className="text-slate-600 mb-6">
              We need a bit more information to verify your business.
            </p>

            {verification?.rejection_reason && (
              <div className="bg-red-50 rounded-xl p-6 mb-6 text-left border border-red-100">
                <h3 className="font-semibold text-red-900 mb-2 text-sm uppercase tracking-wide">
                  Reason
                </h3>
                <p className="text-red-800 text-sm leading-relaxed">
                  {verification.rejection_reason}
                </p>
              </div>
            )}

            <p className="text-slate-600 text-sm mb-8">
              Please review the feedback and resubmit with the necessary
              corrections.
            </p>

            <Button
              onClick={() => (window.location.href = "/get-started")}
              className="w-full"
            >
              Update Application
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Pending Status
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-50 p-6">
      <div className="max-w-lg w-full">
        <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-10 text-center">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-12 h-12 text-blue-600" />
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Under review
          </h2>
          <p className="text-slate-600 mb-8">
            We're reviewing your application. This typically takes 1-3 business
            days.
          </p>

          <div className="bg-blue-50 rounded-xl p-6 mb-6 text-left">
            <h3 className="font-semibold text-blue-900 mb-3 text-sm uppercase tracking-wide">
              What's happening
            </h3>
            <ul className="space-y-2.5 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>Documents are being reviewed</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>You'll receive an email notification</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>No action required from you</span>
              </li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={fetchVerificationStatus}
              variant="outline"
              className="flex-1"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            <Button onClick={logout} variant="ghost" className="flex-1">
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
