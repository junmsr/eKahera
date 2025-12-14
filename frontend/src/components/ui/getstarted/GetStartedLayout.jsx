import React from "react";
import { Link } from "react-router-dom";
import Background from "../../../components/layout/Background";
import Card from "../../../components/common/Card";
import ProgressBar from "./ProgressBar";
import Stepper from "./Stepper";
import Button from "../../../components/common/Button";
import Loader from "../../../components/common/Loader";

/**
 * GetStartedLayout
 * - Encapsulates two-column card, aside hero and right content area
 * - Controls (back/next/finish) and progress/stepper are inside
 */
function GetStartedLayout({
  step,
  steps,
  progress,
  loading,
  errors,
  form = {}, // Default to empty object to prevent undefined errors
  success = false,
  onBack,
  onNext,
  onFinish,
  children,
}) {
  const showBack = step > 0 && !success;
  const isOtpStep = step === 1;
  const showNext = step < steps.length - 1 && !isOtpStep && !success;
  const showFinish = step === steps.length - 1 && !success;
  const showSuccess = success;

  // Check if current step is valid
  const isStepValid = () => {
    if (step === 0) {
      // Account Info step
      return (
        form.email &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) &&
        form.firstName &&
        form.fullName &&
        form.username &&
        form.mobile?.length === 11 &&
        form.password &&
        form.confirmPassword &&
        form.password === form.confirmPassword &&
        form.password.length >= 12 &&
        /[A-Z]/.test(form.password) &&
        /[a-z]/.test(form.password) &&
        /\d/.test(form.password) &&
        /[!@#$%^&*(),.?":{}|<>]/.test(form.password)
      );
    } else if (step === 2) {
      // Business Details step
      return (
        form.businessName &&
        (form.useAdminEmail ||
          (form.businessEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.businessEmail))) &&
        form.businessType &&
        (form.businessType !== 'Others' || form.customBusinessType) &&
        form.region &&
        form.province &&
        form.city &&
        form.barangay
      );
    } else if (step === 3) {
      // Document Upload step
      return (
        form.documents?.length > 0 &&
        form.acceptTerms &&
        form.acceptPrivacy &&
        ['Business Registration Certificate (DTI/SEC/CDA)', 
         "Mayor's Permit / Business Permit", 
         'BIR Certificate of Registration (Form 2303)']
          .every(reqType => form.documentTypes?.includes(reqType)) &&
        form.documentTypes?.every(type => type)
      );
    }
    return true; // For other steps (like OTP), consider them valid by default
  };

  return (
    <Background variant="gradientBlue" pattern="dots" overlay floatingElements>
      <div className="flex justify-center px-4 py-10">
        <Card className="w-full max-w-5xl overflow-hidden rounded-3xl p-0">
          <div className="md:flex">
            <aside className="hidden md:flex md:w-5/12 items-center justify-center bg-gradient-to-br from-blue-600 via-blue-400 to-blue-500 p-10 relative">
              <div className="text-center max-w-sm">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold mb-5 border border-white/30">
                  <span>Quick setup</span>
                  <span className="opacity-80">•</span>
                  <span>Secure</span>
                </div>
                <h3 className="text-white text-2xl font-bold mb-3">
                  Welcome to your business journey
                </h3>
                <p className="text-white/90 text-sm mb-6">
                  Create your account, verify your email, add business details
                  and upload documents. You're minutes away from a modern POS.
                </p>
               { /*
                <ul className="text-left text-white/95 text-sm space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-white"></span>{" "}
                    Guided, step-by-step flow
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-white"></span>{" "}
                    Save & resume automatically
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-white"></span>{" "}
                    Bank‑grade security
                  </li>
                </ul>
                */}
              </div>
            </aside>

            <main className="w-full md:w-7/12 p-6 md:p-10 flex flex-col">
              {/* Back to home button */}
              <div className="mb-4">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  Back to home
                </Link>
              </div>
              <div className="mb-6">
                <div className="flex items-center justify-center">
                  <div className="w-full max-w-md">
                    <ProgressBar percent={progress} />
                  </div>
                </div>
                <div className="mt-4">
                  <Stepper steps={steps} currentStep={step} />
                </div>
              </div>

              <div className="flex-1">
                {errors?.general && (
                  <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {errors.general}
                  </div>
                )}

                <div className="max-w-lg">{children}</div>
              </div>

              {(showBack || showNext || showFinish || showSuccess) && (
                <div className="mt-8 md:mt-6 flex items-center justify-center gap-4">
                  {showBack && (
                    <Button
                      onClick={onBack}
                      disabled={loading}
                      variant="secondary"
                      className="w-32"
                    >
                      Back
                    </Button>
                  )}
                  {showNext && (
                    <Button
                      onClick={onNext}
                      disabled={loading || !isStepValid()}
                      variant="primary"
                      className="w-48"
                    >
                      {loading ? <Loader size="sm" /> : "Continue"}
                    </Button>
                  )}
                  {showFinish && (
                    <Button
                      onClick={onFinish}
                      disabled={loading || 
                        !form?.documents?.length || 
                        !form?.acceptTerms || 
                        !form?.acceptPrivacy ||
                        // Check if all required documents are uploaded and have types
                        !['Business Registration Certificate (DTI/SEC/CDA)', 
                          "Mayor's Permit / Business Permit", 
                          'BIR Certificate of Registration (Form 2303)']
                          .every(reqType => form.documentTypes?.includes(reqType)) ||
                        // Check if all uploaded documents have a type selected
                        form.documentTypes?.some(type => !type)
                      }
                      variant="primary"
                      className="w-48"
                    >
                      {loading ? <Loader size="sm" /> : "Finish"}
                    </Button>
                  )}
                  {showSuccess && (
                    <Button
                      onClick={() => (window.location.href = "/")}
                      variant="primary"
                      className="w-48"
                    >
                      Return to Home
                    </Button>
                  )}
                </div>
              )}

              <div className="mt-4 text-[11px] text-gray-500 text-center">
                Your data is encrypted in transit and at rest.
              </div>
            </main>
          </div>
        </Card>
      </div>
    </Background>
  );
}

export default GetStartedLayout;
