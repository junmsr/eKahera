import React from "react";
import useGetStarted from "./useGetStarted";
import GetStartedLayout from "./GetStartedLayout";
import GetStartedForm from "./GetStartedForm";
import Card from "../../common/Card";
import SectionHeader from "../../layout/SectionHeader";
import Button from "../../common/Button";

export default function GetStartedSingle({ onOpenTerms, onOpenPrivacy }) {
  const hook = useGetStarted();
  const { step, steps, progress, loading, errors, handleBack, handleNext, handleFinish, success, isOtpVerified } = hook;

  if (success) {
    return (
      <GetStartedLayout
        step={step}
        steps={steps}
        progress={100}
        loading={false}
        errors={{}}
      >
        <div className="flex flex-col items-center justify-center px-4 py-12">

          <Card className="rounded-3xl p-10 flex flex-col items-center max-w-2xl">
            <SectionHeader className="text-3xl md:text-4xl text-gray-900 mb-4">
              📄 Application Submitted!
            </SectionHeader>
            <p className="text-gray-800 mb-6 text-base text-center max-w-md">
              Your business application has been submitted successfully! Our verification team will review your documents.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 w-full max-w-md">
              <h4 className="font-semibold text-blue-800 mb-2">What happens next?</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Document verification (1-3 business days)</li>
                <li>• Email notification once complete</li>
                <li>• Full access upon approval</li>
              </ul>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 w-full max-w-md">
              <p className="text-sm text-yellow-800 text-center">
                <strong>Please wait 1-3 business days</strong> for verification. You will receive an email notification once the review is complete.
              </p>
            </div>
            
            <Button
              label="Go to Login"
              onClick={() => (window.location.href = "/login")}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2 rounded-full font-semibold shadow"
            />
          </Card>
        </div>
      </GetStartedLayout>
    );
  }

  return (
    <GetStartedLayout
      step={step}
      steps={steps}
      progress={progress}
      loading={loading}
      errors={errors}
      onBack={handleBack}
      onNext={handleNext}
      onFinish={handleFinish}
    >
      <GetStartedForm hook={hook} isOtpVerified={isOtpVerified} />

      {step === 3 && (
        <div className="mt-6 space-y-3 max-w-lg">
          <div className="flex items-start gap-2">
            <input
              id="acceptTerms"
              type="checkbox"
              checked={hook.form.acceptTerms}
              onChange={(e) => hook.setForm(f => ({ ...f, acceptTerms: e.target.checked }))}
              className="mt-1 w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="acceptTerms" className="text-sm text-gray-700">
              I agree to the{" "}
              <button type="button" onClick={onOpenTerms} className="text-blue-700 underline underline-offset-2 hover:text-blue-800">
                Terms and Conditions
              </button>.
            </label>
          </div>

          <div className="flex items-start gap-2">
            <input
              id="acceptPrivacy"
              type="checkbox"
              checked={hook.form.acceptPrivacy}
              onChange={(e) => hook.setForm(f => ({ ...f, acceptPrivacy: e.target.checked }))}
              className="mt-1 w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="acceptPrivacy" className="text-sm text-gray-700">
              I have read the{" "}
              <button type="button" onClick={onOpenPrivacy} className="text-blue-700 underline underline-offset-2 hover:text-blue-800">
                Privacy Policy
              </button>.
            </label>
          </div>

          {errors.accept && (
            <p className="text-red-500 text-sm">{errors.accept}</p>
          )}
        </div>
      )}
    </GetStartedLayout>
  );
}