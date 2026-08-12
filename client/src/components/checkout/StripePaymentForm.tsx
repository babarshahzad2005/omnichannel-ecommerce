import { useState } from "react";
import {
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { Lock } from "lucide-react";
import toast from "react-hot-toast";

interface StripePaymentFormProps {
  onSuccess: () => void;
  onError: (message: string) => void;
  submitLabel?: string;
}

export default function StripePaymentForm({
  onSuccess,
  onError,
  submitLabel = "Complete payment",
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/orders`,
      },
      redirect: "if_required",
    });

    setProcessing(false);

    if (result.error) {
      onError(result.error.message ?? "Payment failed");
      toast.error(result.error.message ?? "Payment failed");
      return;
    }

    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement
        options={{
          layout: "tabs",
        }}
      />
      <p className="flex items-center gap-1.5 text-xs text-slate-500">
        <Lock className="h-3.5 w-3.5" />
        Payments are encrypted and secure
      </p>
      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full rounded-lg bg-cobalt-600 py-3 text-sm font-medium text-white transition hover:bg-cobalt-700 disabled:opacity-50"
      >
        {processing ? "Processing..." : submitLabel}
      </button>
    </form>
  );
}
