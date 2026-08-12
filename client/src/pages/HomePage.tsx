import { Link } from "react-router-dom";
import PlaceholderPage from "../components/PlaceholderPage";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-slate-200 bg-white p-10 shadow-sm">
        <p className="text-sm font-medium tracking-wide text-cobalt-600 uppercase">
          OmniChannel Commerce
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-ink">
          Shop across channels with real-time inventory
        </h1>
        <p className="mt-4 max-w-2xl text-slate-600">
          Browse products, manage your cart, and track orders from one unified
          storefront experience.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/products"
            className="rounded-lg bg-cobalt-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-cobalt-700"
          >
            Browse products
          </Link>
          <Link
            to="/register"
            className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-slate-50"
          >
            Create account
          </Link>
        </div>
      </section>

      <PlaceholderPage
        title="Featured categories"
        description="Product catalog and search will be implemented in the next phase."
      />
    </div>
  );
}
