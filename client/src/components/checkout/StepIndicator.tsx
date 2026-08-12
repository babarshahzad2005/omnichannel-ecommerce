import { Check, Lock } from "lucide-react";

export type CheckoutStep = 1 | 2 | 3;

interface StepIndicatorProps {
  currentStep: CheckoutStep;
}

const STEPS = [
  { step: 1 as const, label: "Shipping" },
  { step: 2 as const, label: "Payment" },
  { step: 3 as const, label: "Review" },
];

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-0">
      {STEPS.map(({ step, label }, index) => {
        const isCompleted = step < currentStep;
        const isActive = step === currentStep;

        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition ${
                  isCompleted
                    ? "bg-cobalt-600 text-white"
                    : isActive
                      ? "bg-cobalt-600 text-white ring-4 ring-cobalt-600/20"
                      : "border-2 border-slate-200 bg-white text-slate-400"
                }`}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : step}
              </div>
              <span
                className={`mt-2 text-xs font-medium ${
                  isActive || isCompleted ? "text-cobalt-600" : "text-slate-400"
                }`}
              >
                {label}
              </span>
            </div>

            {index < STEPS.length - 1 && (
              <div
                className={`mx-3 mb-5 h-0.5 w-16 sm:w-24 ${
                  step < currentStep ? "bg-cobalt-600" : "bg-slate-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function SecureCheckoutHeader() {
  return (
    <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
      <Lock className="h-4 w-4" />
      Secure checkout
    </div>
  );
}
