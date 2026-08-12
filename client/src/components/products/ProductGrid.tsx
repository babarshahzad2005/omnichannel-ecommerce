import type { Product, StockStatus } from "../../types/product";
import ProductCard from "./ProductCard";

interface ProductGridProps {
  products: Product[];
  stockMap: Record<string, StockStatus>;
  loading?: boolean;
}

function ProductSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="aspect-square bg-slate-100" />
      <div className="space-y-3 p-4">
        <div className="h-4 rounded bg-slate-100" />
        <div className="h-3 w-2/3 rounded bg-slate-100" />
        <div className="h-8 rounded bg-slate-100" />
      </div>
    </div>
  );
}

export default function ProductGrid({ products, stockMap, loading }: ProductGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <ProductSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
        <h3 className="text-lg font-semibold text-ink">No products found</h3>
        <p className="mt-2 text-sm text-slate-500">
          Try adjusting your search or filters to find what you&apos;re looking for.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard
          key={product._id}
          product={product}
          stockStatus={stockMap[product._id]}
        />
      ))}
    </div>
  );
}
