import React from "react";
import SectionHeader from "../../../components/layout/SectionHeader";
import Input from "../../../components/common/Input";
import Button from "../../../components/common/Button";
import Loader from "../../../components/common/Loader";

export default function GetStartedForm({ hook }) {
  const {
    step,
    steps,
    form,
    errors,
    loading,
    otpVerified,
    inputRef,
    handleChange,
    setShowPassword,
    showPassword,
    setShowConfirm,
    showConfirm,
  } = hook;

  switch (step) {
    case 0:
      return (
        <div className="space-y-4">
          <SectionHeader className="text-2xl md:text-3xl text-gray-900">
            Account Info
          </SectionHeader>
          <div className="grid gap-4">
            <div>
              <label className="block mb-1 text-sm text-gray-700 font-medium">
                Email
              </label>
              <Input
                ref={inputRef}
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter your email address"
                type="email"
                error={errors.email}
              />
            </div>

            <div>
              <label className="block mb-1 text-sm text-gray-700 font-medium">
                Username
              </label>
              <Input
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="Choose a username (3-20 characters)"
                type="text"
                error={errors.username}
              />
            </div>

            <div>
              <label className="block mb-1 text-sm text-gray-700 font-medium">
                Mobile Number
              </label>
              <Input
                name="mobile"
                value={form.mobile}
                onChange={handleChange}
                placeholder="09xxxxxxxxx"
                type="tel"
                maxLength={15}
                error={errors.mobile}
              />
            </div>

            <div>
              <label className="block mb-1 text-sm text-gray-700 font-medium">
                Password
              </label>
              <Input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter password"
                error={errors.password}
                suffix={
                  <Button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    isPasswordToggle
                    showPassword={showPassword}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    tabIndex={-1}
                  />
                }
              />
            </div>

            <div>
              <label className="block mb-1 text-sm text-gray-700 font-medium">
                Password Confirmation
              </label>
              <Input
                type={showConfirm ? "text" : "password"}
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter password"
                error={errors.confirmPassword}
                suffix={
                  <Button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    isPasswordToggle
                    showPassword={showConfirm}
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                    tabIndex={-1}
                  />
                }
              />
            </div>
          </div>
        </div>
      );

    case 1:
      return (
        <div className="space-y-4">
          <SectionHeader className="text-2xl md:text-3xl text-gray-900">
            OTP Verification
          </SectionHeader>
          <p className="text-gray-700 mb-2 text-sm">
            We've sent a 4-character verification code to{" "}
            <strong>{form.email}</strong>.
          </p>

          <div>
            <label className="block mb-1 text-sm text-gray-700 font-medium">
              Enter OTP
            </label>
            <Input
              ref={inputRef}
              name="otp"
              value={form.otp}
              onChange={async (e) => {
                const value = e.target.value.slice(0, 4);
                handleChange({ target: { name: "otp", value } });

                if (errors.otp) hook.setErrors({ ...errors, otp: null });

                if (value.length === 4) {
                  hook.setLoading(true);
                  try {
                    const otpResponse = await fetch(
                      "http://localhost:5000/api/otp/verify",
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email: form.email, otp: value }),
                      }
                    );
                    if (otpResponse.ok) {
                      hook.setOtpVerified(true);
                      setTimeout(() => {
                        hook.setStep((s) => s + 1);
                        hook.setOtpVerified(false);
                      }, 800);
                    } else {
                      const error = await otpResponse.json();
                      hook.setErrors({
                        otp: error.error || "OTP verification failed",
                      });
                    }
                  } catch {
                    hook.setErrors({ otp: "Network error. Please try again." });
                  } finally {
                    hook.setLoading(false);
                  }
                }
              }}
              placeholder="Enter 4-character code (auto-verifies)"
              type="text"
              maxLength={4}
              error={errors.otp}
            />
            {loading && form.otp.length === 4 && (
              <div className="mt-2 text-gray-700 text-sm font-medium flex items-center">
                <Loader size="sm" className="mr-2" />
                Verifying OTP...
              </div>
            )}
            {otpVerified && (
              <div className="mt-2 text-green-600 text-sm font-medium flex items-center">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                OTP verified successfully!
              </div>
            )}
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={async () => {
                hook.setLoading(true);
                try {
                  const response = await fetch(
                    "http://localhost:5000/api/otp/resend",
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email: form.email }),
                    }
                  );
                  if (response.ok) alert("New OTP sent successfully!");
                  else {
                    const error = await response.json();
                    alert(error.error || "Failed to resend OTP");
                  }
                } catch {
                  alert("Network error. Please try again.");
                } finally {
                  hook.setLoading(false);
                }
              }}
              className="text-gray-700 hover:text-gray-900 text-sm underline"
              disabled={loading}
            >
              {loading ? "Sending..." : "Resend OTP"}
            </button>
          </div>
        </div>
      );

    case 2:
      return (
        <div className="space-y-4">
          <SectionHeader className="text-2xl md:text-3xl text-gray-900">
            Business Details
          </SectionHeader>

          <div className="grid gap-4">
            <div>
              <label className="block mb-1 text-sm text-gray-700 font-medium">
                Business Name <span className="text-red-500">*</span>
              </label>
              <Input
                name="businessName"
                value={form.businessName}
                onChange={handleChange}
                placeholder="Enter business name"
                error={errors.businessName}
              />
            </div>

            <div>
              <label className="block mb-1 text-sm text-gray-700 font-medium">
                Business Type <span className="text-red-500">*</span>
              </label>
              <Input
                name="businessType"
                value={form.businessType}
                onChange={handleChange}
                placeholder="e.g. Retail, Services, etc."
                error={errors.businessType}
              />
            </div>

            <div>
              <div className="mb-2 mt-4 font-semibold text-gray-900">
                Business Location
              </div>
              <label className="block mb-1 text-sm text-gray-700 font-medium">
                Country <span className="text-red-500">*</span>
              </label>
              <Input
                name="country"
                value={form.country}
                onChange={handleChange}
                placeholder="Enter country"
                error={errors.country}
              />
            </div>

            <div>
              <label className="block mb-1 text-sm text-gray-700 font-medium">
                Business Address <span className="text-red-500">*</span>
              </label>
              <Input
                name="businessAddress"
                value={form.businessAddress}
                onChange={handleChange}
                placeholder="Enter business address"
                error={errors.businessAddress}
              />
            </div>

            <div>
              <label className="block mb-1 text-sm text-gray-700 font-medium">
                House no./ Street Name / Landmark (optional)
              </label>
              <Input
                name="houseNumber"
                value={form.houseNumber}
                onChange={handleChange}
                placeholder="Enter house no., street, or landmark (optional)"
              />
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
}
