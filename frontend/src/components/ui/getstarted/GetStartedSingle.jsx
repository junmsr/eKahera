import React from "react";
import useGetStarted from "./useGetStarted";
import GetStartedLayout from "./GetStartedLayout";
import GetStartedForm from "./GetStartedForm";
import Card from "../../common/Card";
import SectionHeader from "../../layout/SectionHeader";
import Button from "../../common/Button";

export default function GetStartedSingle({ onOpenTerms, onOpenPrivacy }) {
  const hook = useGetStarted();
  const {
    step,
    steps,
    progress,
    loading,
    errors,
    handleBack,
    handleNext,
    handleFinish,
    success,
    isOtpVerified,
  } = hook;

  if (success) {
    return (
      <GetStartedLayout
        step={step}
        steps={steps}
        progress={100}
        loading={false}
        errors={{}}
        success={true}
      >
        <div className="flex flex-col items-center justify-center px-4 py-12">
          <Card className="rounded-3xl p-10 flex flex-col items-center max-w-2xl">
            <SectionHeader className="text-3xl md:text-4xl text-gray-900 mb-4">
              Application Submitted!
            </SectionHeader>
            <p className="text-gray-800 mb-6 text-base text-center max-w-md">
              Your business application has been submitted successfully! Our
              verification team will review your documents.
            </p>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 w-full max-w-md">
              <p className="text-sm text-yellow-800 text-center">
                <strong>Please wait 1-3 business days</strong> for verification.
                You will receive an email notification once the review is
                complete.
              </p>
            </div>
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
      form={hook.form}
      onBack={handleBack}
      onNext={handleNext}
      onFinish={handleFinish}
    >
      <GetStartedForm
        hook={hook}
        isOtpVerified={isOtpVerified}
        onOpenTerms={onOpenTerms}
        onOpenPrivacy={onOpenPrivacy}
      />
    </GetStartedLayout>
  );
}
