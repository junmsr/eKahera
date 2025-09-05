import React from "react";
import Background from "../../../components/layout/Background";
import Card from "../../../components/common/Card";
import Logo from "../../../components/common/Logo";
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
  onBack,
  onNext,
  onFinish,
  children,
}) {
  const showBack = step > 0;
  const isOtpStep = step === 1;
  const showNext = step < steps.length - 1 && !isOtpStep;
  const showFinish = step === steps.length - 1;

  return (
    <Background variant="gradientBlue" pattern="dots" overlay floatingElements>
      <div className="flex justify-center px-4 py-10">
        <Card className="w-full max-w-5xl overflow-hidden rounded-3xl p-0">
          <div className="md:flex">
            <aside className="hidden md:flex md:w-5/12 items-center justify-center bg-gradient-to-br from-blue-600 to-blue-400 p-10 relative">
              <div className="text-center max-w-xs">
                <div className="absolute top-8 left-10">
                  <Logo size={48} />
                </div>
                <h3 className="text-white text-2xl font-bold mb-4">
                  Welcome to your business journey!
                </h3>
                <p className="text-white/85 text-sm">
                  Let's set up your account in a few easy steps.
                </p>
              </div>
            </aside>

            <main className="w-full md:w-7/12 p-6 md:p-10 flex flex-col">
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <div className="w-2/3">
                    <ProgressBar percent={progress} />
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-600">
                      {steps.map((s, i) => (
                        <span
                          key={s.label}
                          className={`inline-block ml-3 ${
                            i === step ? "text-gray-900 font-semibold" : ""
                          }`}
                        >
                          {s.label}
                        </span>
                      ))}
                    </div>
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

              <div className="mt-8 md:mt-6 flex items-center justify-between">
                {showBack ? (
                  <Button onClick={onBack} variant="secondary" className="w-28">
                    Back
                  </Button>
                ) : (
                  <div />
                )}

                {showNext ? (
                  <Button
                    onClick={onNext}
                    disabled={loading}
                    variant="primary"
                    className="w-32"
                  >
                    {loading ? <Loader size="sm" /> : "Next"}
                  </Button>
                ) : isOtpStep ? (
                  <div className="text-sm text-gray-700">
                    {loading ? "Verifying..." : "Enter the 4-character code"}
                  </div>
                ) : showFinish ? (
                  <Button
                    onClick={onFinish}
                    disabled={loading}
                    variant="primary"
                    className="w-32"
                  >
                    {loading ? <Loader className="mr-2" size="sm" /> : null}
                    {loading ? "Finishing..." : "Finish"}
                  </Button>
                ) : null}
              </div>
            </main>
          </div>
        </Card>
      </div>
    </Background>
  );
}

export default GetStartedLayout;
