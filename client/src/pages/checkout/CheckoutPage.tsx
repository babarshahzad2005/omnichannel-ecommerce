import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Elements, PaymentElement } from "@stripe/react-stripe-js";
import { Clock, CreditCard, Lock, Truck } from "lucide-react";
import toast from "react-hot-toast";
import CartItemRow from "../../components/checkout/CartItemRow";
import OrderSummary from "../../components/checkout/OrderSummary";
import StepIndicator, { SecureCheckoutHeader } from "../../components/checkout/StepIndicator";
import StripePaymentForm from "../../components/checkout/StripePaymentForm";
import { createOrder, createPaymentIntent } from "../../services/cartService";
import { getStripe, isStripeConfigured } from "../../services/stripe";
import { useCartStore } from "../../store/cartStore";
import { useAuthStore } from "../../store/authStore";
import type { CheckoutStep } from "../../components/checkout/StepIndicator";
import type { PaymentMethod, ShippingAddress } from "../../types/cart";
import { formatReservationTime } from "../../utils/checkout";
import { formatPrice } from "../../utils/product";

const EMPTY_ADDRESS: ShippingAddress = {
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "United States",
};

const RESERVATION_SECONDS = 15 * 60;

export default function CheckoutPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const {
    items,
    loading,
    couponInput,
    appliedCoupon,
    fetchCart,
    applyCoupon,
    clearCoupon,
    setCouponInput,
    getTotals,
    reset: resetCart,
  } = useCartStore();

  const [step, setStep] = useState<CheckoutStep>(1);
  const [address, setAddress] = useState<ShippingAddress>(() => ({
    ...EMPTY_ADDRESS,
    fullName: user?.name ?? "",
  }));
  const [addressErrors, setAddressErrors] = useState<Partial<Record<keyof ShippingAddress, string>>>({});
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("stripe");
  const [deliveryMethod, setDeliveryMethod] = useState<"standard" | "express">("standard");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [reservationSeconds, setReservationSeconds] = useState(RESERVATION_SECONDS);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

  useEffect(() => {
    void fetchCart();
  }, [fetchCart]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setReservationSeconds((current) => (current > 0 ? current - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const totals = getTotals();
  const displayShipping =
    deliveryMethod === "express" ? 12.99 : totals.shippingCost;
  const displayTotal =
    totals.subtotal + totals.tax + displayShipping - totals.discount;

  const validateAddress = (): boolean => {
    const errors: Partial<Record<keyof ShippingAddress, string>> = {};

    if (!address.fullName.trim()) errors.fullName = "Full name is required";
    if (!address.phone.trim()) errors.phone = "Phone is required";
    if (!address.addressLine1.trim()) errors.addressLine1 = "Address is required";
    if (!address.city.trim()) errors.city = "City is required";
    if (!address.state.trim()) errors.state = "State is required";
    if (!address.postalCode.trim()) errors.postalCode = "Postal code is required";
    if (!address.country.trim()) errors.country = "Country is required";

    setAddressErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddressChange = (field: keyof ShippingAddress, value: string) => {
    setAddress((current) => ({ ...current, [field]: value }));
    if (addressErrors[field]) {
      setAddressErrors((current) => ({ ...current, [field]: undefined }));
    }
  };

  const handleApplyCoupon = async () => {
    setApplyingCoupon(true);
    try {
      await applyCoupon();
      toast.success("Coupon applied");
    } catch {
      // handled by interceptor
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleContinueFromShipping = () => {
    if (!validateAddress()) return;
    setStep(2);
  };

  const handleContinueFromPayment = () => {
    if (paymentMethod === "stripe" && !isStripeConfigured()) {
      toast.error("Stripe is not configured. Use Cash on Delivery or set VITE_STRIPE_PUBLISHABLE_KEY.");
      return;
    }
    setStep(3);
  };

  const handlePlaceOrder = async () => {
    if (!validateAddress()) {
      setStep(1);
      return;
    }

    setPlacingOrder(true);

    try {
      const order = await createOrder({
        shippingAddress: address,
        paymentMethod,
        couponCode: appliedCoupon?.code,
        notes:
          deliveryMethod === "express"
            ? "Preferred delivery: Express (1–2 business days)"
            : undefined,
      });

      setCreatedOrderId(order._id);

      if (paymentMethod === "cod") {
        resetCart();
        toast.success("Order placed successfully!");
        navigate(`/orders/${order._id}`);
        return;
      }

      const intent = await createPaymentIntent(order._id);
      setClientSecret(intent.clientSecret);
      toast.success("Order created. Complete your payment below.");
    } catch {
      // handled by interceptor
    } finally {
      setPlacingOrder(false);
    }
  };

  const handlePaymentSuccess = () => {
    resetCart();
    toast.success("Payment successful!");
    navigate(createdOrderId ? `/orders/${createdOrderId}` : "/orders");
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cobalt-600 border-t-transparent" />
      </div>
    );
  }

  if (items.length === 0 && !createdOrderId) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-slate-200 bg-white px-8 py-16 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-ink">Nothing to checkout</h1>
        <p className="mt-2 text-sm text-slate-500">Your cart is empty.</p>
        <Link
          to="/products"
          className="mt-6 inline-flex rounded-lg bg-cobalt-600 px-6 py-2.5 text-sm font-medium text-white"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  const summaryTotals = {
    ...totals,
    shippingCost: displayShipping,
    total: displayTotal,
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <SecureCheckoutHeader />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <StepIndicator currentStep={step} />
        <div className="flex items-center justify-center gap-2 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-mint-500">
          <Clock className="h-4 w-4" />
          Items reserved for {formatReservationTime(reservationSeconds)}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          {step === 1 && (
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-ink">Delivery address</h2>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium text-ink">
                    Full name
                  </label>
                  <input
                    id="fullName"
                    value={address.fullName}
                    onChange={(event) => handleAddressChange("fullName", event.target.value)}
                    className={`w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none ${
                      addressErrors.fullName
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                        : "border-slate-200 focus:border-cobalt-600 focus:ring-cobalt-600/20"
                    }`}
                  />
                  {addressErrors.fullName && (
                    <p className="mt-1 text-xs text-red-600">{addressErrors.fullName}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-ink">
                    Phone
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={address.phone}
                    onChange={(event) => handleAddressChange("phone", event.target.value)}
                    className={`w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none ${
                      addressErrors.phone
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                        : "border-slate-200 focus:border-cobalt-600 focus:ring-cobalt-600/20"
                    }`}
                  />
                  {addressErrors.phone && (
                    <p className="mt-1 text-xs text-red-600">{addressErrors.phone}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="addressLine1" className="mb-1.5 block text-sm font-medium text-ink">
                    Address line 1
                  </label>
                  <input
                    id="addressLine1"
                    value={address.addressLine1}
                    onChange={(event) => handleAddressChange("addressLine1", event.target.value)}
                    className={`w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none ${
                      addressErrors.addressLine1
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                        : "border-slate-200 focus:border-cobalt-600 focus:ring-cobalt-600/20"
                    }`}
                  />
                  {addressErrors.addressLine1 && (
                    <p className="mt-1 text-xs text-red-600">{addressErrors.addressLine1}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="addressLine2" className="mb-1.5 block text-sm font-medium text-ink">
                    Address line 2 <span className="text-slate-400">(optional)</span>
                  </label>
                  <input
                    id="addressLine2"
                    value={address.addressLine2 ?? ""}
                    onChange={(event) => handleAddressChange("addressLine2", event.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-cobalt-600 focus:ring-2 focus:ring-cobalt-600/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="city" className="mb-1.5 block text-sm font-medium text-ink">
                    City
                  </label>
                  <input
                    id="city"
                    value={address.city}
                    onChange={(event) => handleAddressChange("city", event.target.value)}
                    className={`w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none ${
                      addressErrors.city
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                        : "border-slate-200 focus:border-cobalt-600 focus:ring-cobalt-600/20"
                    }`}
                  />
                  {addressErrors.city && (
                    <p className="mt-1 text-xs text-red-600">{addressErrors.city}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="state" className="mb-1.5 block text-sm font-medium text-ink">
                    State
                  </label>
                  <input
                    id="state"
                    value={address.state}
                    onChange={(event) => handleAddressChange("state", event.target.value)}
                    className={`w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none ${
                      addressErrors.state
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                        : "border-slate-200 focus:border-cobalt-600 focus:ring-cobalt-600/20"
                    }`}
                  />
                  {addressErrors.state && (
                    <p className="mt-1 text-xs text-red-600">{addressErrors.state}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="postalCode" className="mb-1.5 block text-sm font-medium text-ink">
                    Postal code
                  </label>
                  <input
                    id="postalCode"
                    value={address.postalCode}
                    onChange={(event) => handleAddressChange("postalCode", event.target.value)}
                    className={`w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none ${
                      addressErrors.postalCode
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                        : "border-slate-200 focus:border-cobalt-600 focus:ring-cobalt-600/20"
                    }`}
                  />
                  {addressErrors.postalCode && (
                    <p className="mt-1 text-xs text-red-600">{addressErrors.postalCode}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="country" className="mb-1.5 block text-sm font-medium text-ink">
                    Country
                  </label>
                  <input
                    id="country"
                    value={address.country}
                    onChange={(event) => handleAddressChange("country", event.target.value)}
                    className={`w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none ${
                      addressErrors.country
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                        : "border-slate-200 focus:border-cobalt-600 focus:ring-cobalt-600/20"
                    }`}
                  />
                  {addressErrors.country && (
                    <p className="mt-1 text-xs text-red-600">{addressErrors.country}</p>
                  )}
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-ink">Delivery method</h3>
                <div className="mt-3 space-y-2">
                  <label className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 px-4 py-3 has-checked:border-cobalt-600 has-checked:bg-cobalt-50">
                    <span className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="delivery"
                        checked={deliveryMethod === "standard"}
                        onChange={() => setDeliveryMethod("standard")}
                        className="h-4 w-4 text-cobalt-600 focus:ring-cobalt-600"
                      />
                      <span>
                        <span className="block text-sm font-medium text-ink">
                          Standard (3–5 business days)
                        </span>
                      </span>
                    </span>
                    <span className="text-sm font-medium text-mint-500">
                      {totals.shippingCost === 0 ? "Free" : formatPrice(totals.shippingCost)}
                    </span>
                  </label>

                  <label className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 px-4 py-3 has-checked:border-cobalt-600 has-checked:bg-cobalt-50">
                    <span className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="delivery"
                        checked={deliveryMethod === "express"}
                        onChange={() => setDeliveryMethod("express")}
                        className="h-4 w-4 text-cobalt-600 focus:ring-cobalt-600"
                      />
                      <span className="block text-sm font-medium text-ink">
                        Express (1–2 business days)
                      </span>
                    </span>
                    <span className="text-sm font-medium text-ink">$12.99</span>
                  </label>
                </div>
              </div>

              <button
                type="button"
                onClick={handleContinueFromShipping}
                className="mt-6 w-full rounded-lg bg-cobalt-600 py-3 text-sm font-medium text-white transition hover:bg-cobalt-700"
              >
                Continue to payment
              </button>
            </section>
          )}

          {step === 2 && (
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-ink">Payment</h2>

              <div className="mt-5 space-y-3">
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-4 has-checked:border-cobalt-600 has-checked:bg-cobalt-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === "stripe"}
                    onChange={() => setPaymentMethod("stripe")}
                    className="mt-1 h-4 w-4 text-cobalt-600 focus:ring-cobalt-600"
                  />
                  <div className="flex-1">
                    <span className="flex items-center gap-2 text-sm font-medium text-ink">
                      <CreditCard className="h-4 w-4" />
                      Credit or Debit Card
                    </span>
                    <div className="mt-2 flex gap-2">
                      {["Visa", "MC", "Amex"].map((brand) => (
                        <span
                          key={brand}
                          className="rounded border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-500"
                        >
                          {brand}
                        </span>
                      ))}
                    </div>
                    {paymentMethod === "stripe" && isStripeConfigured() && (
                      <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-4">
                        <Elements
                          stripe={getStripe()}
                          options={{
                            mode: "payment",
                            amount: Math.max(Math.round(displayTotal * 100), 50),
                            currency: "usd",
                          }}
                        >
                          <PaymentElement />
                        </Elements>
                        <p className="mt-3 text-xs text-slate-500">
                          Payment is processed securely when you place your order.
                        </p>
                      </div>
                    )}
                    {paymentMethod === "stripe" && !isStripeConfigured() && (
                      <p className="mt-2 text-xs text-amber-600">
                        Stripe publishable key not configured. Set VITE_STRIPE_PUBLISHABLE_KEY.
                      </p>
                    )}
                  </div>
                </label>

                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-4 has-checked:border-cobalt-600 has-checked:bg-cobalt-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === "cod"}
                    onChange={() => setPaymentMethod("cod")}
                    className="h-4 w-4 text-cobalt-600 focus:ring-cobalt-600"
                  />
                  <div>
                    <span className="flex items-center gap-2 text-sm font-medium text-ink">
                      <Truck className="h-4 w-4" />
                      Cash on Delivery
                    </span>
                    <p className="mt-1 text-xs text-slate-500">
                      Pay when your order arrives at your doorstep.
                    </p>
                  </div>
                </label>
              </div>

              <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
                <Lock className="h-3.5 w-3.5" />
                Payments are encrypted
              </p>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 rounded-lg border border-slate-200 py-3 text-sm font-medium text-ink hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleContinueFromPayment}
                  className="flex-1 rounded-lg bg-cobalt-600 py-3 text-sm font-medium text-white hover:bg-cobalt-700"
                >
                  Continue to review
                </button>
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="space-y-6">
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-ink">Review your order</h2>

                <div className="mt-5 space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-slate-500">Shipping address</h3>
                    <p className="mt-1 text-sm text-ink">
                      {address.fullName}, {address.addressLine1}
                      {address.addressLine2 ? `, ${address.addressLine2}` : ""},{" "}
                      {address.city}, {address.state} {address.postalCode}, {address.country}
                    </p>
                    <p className="text-sm text-slate-600">{address.phone}</p>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="mt-1 text-xs font-medium text-cobalt-600 hover:text-cobalt-700"
                    >
                      Edit
                    </button>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-slate-500">Payment method</h3>
                    <p className="mt-1 text-sm text-ink">
                      {paymentMethod === "stripe" ? "Credit or Debit Card (Stripe)" : "Cash on Delivery"}
                    </p>
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="mt-1 text-xs font-medium text-cobalt-600 hover:text-cobalt-700"
                    >
                      Edit
                    </button>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-slate-500">Delivery</h3>
                    <p className="mt-1 text-sm text-ink">
                      {deliveryMethod === "express"
                        ? "Express (1–2 business days)"
                        : "Standard (3–5 business days)"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-ink">Items</h3>
                <div className="mt-4 divide-y divide-slate-100">
                  {items.map((item) => (
                    <CartItemRow
                      key={`${item.productId}:${item.variantSku ?? "default"}`}
                      item={item}
                      compact
                      onUpdateQty={() => undefined}
                      onRemove={() => undefined}
                    />
                  ))}
                </div>
              </div>

              {!clientSecret ? (
                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={placingOrder}
                  className="w-full rounded-lg bg-cobalt-600 py-3 text-sm font-medium text-white transition hover:bg-cobalt-700 disabled:opacity-50"
                >
                  {placingOrder ? "Placing order..." : "Place Order"}
                </button>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-sm font-semibold text-ink">Complete payment</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Order created. Enter your payment details to finalize.
                  </p>
                  <div className="mt-4">
                    <Elements stripe={getStripe()} options={{ clientSecret }}>
                      <StripePaymentForm
                        onSuccess={handlePaymentSuccess}
                        onError={() => undefined}
                        submitLabel="Pay now"
                      />
                    </Elements>
                  </div>
                </div>
              )}

              {!clientSecret && (
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full rounded-lg border border-slate-200 py-3 text-sm font-medium text-ink hover:bg-slate-50"
                >
                  Back to payment
                </button>
              )}
            </section>
          )}
        </div>

        <OrderSummary
          items={items}
          totals={summaryTotals}
          couponInput={couponInput}
          appliedCoupon={appliedCoupon}
          onCouponInputChange={setCouponInput}
          onApplyCoupon={handleApplyCoupon}
          onClearCoupon={clearCoupon}
          applyingCoupon={applyingCoupon}
          showItems
        />
      </div>
    </div>
  );
}
