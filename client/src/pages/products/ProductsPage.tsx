import { Link } from "react-router-dom";
import FilterSidebar from "../../components/products/FilterSidebar";
import Pagination from "../../components/products/Pagination";
import ProductGrid from "../../components/products/ProductGrid";
import SearchBar from "../../components/products/SearchBar";
import { useProducts } from "../../hooks/useProducts";

const SORT_OPTIONS = [
  { value: "", label: "Most relevant" },
  { value: "-createdAt", label: "Newest" },
  { value: "price", label: "Price: Low to High" },
  { value: "-price", label: "Price: High to Low" },
  { value: "-averageRating", label: "Top rated" },
  { value: "-totalSold", label: "Best selling" },
];

export default function ProductsPage() {
  const {
    filters,
    products,
    facets,
    pagination,
    stockMap,
    loading,
    error,
    setFilters,
    setPage,
  } = useProducts();

  const pageTitle = filters.keyword.trim() || "All products";

  const clearFilters = () => {
    setFilters({
      category: "",
      brand: "",
      minPrice: "",
      maxPrice: "",
      rating: "",
    });
  };

  return (
    <div className="space-y-6">
      <nav className="text-sm text-slate-500">
        <Link to="/" className="hover:text-cobalt-600">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="text-ink">Products</span>
        {filters.keyword && (
          <>
            <span className="mx-2">/</span>
            <span className="text-ink">{filters.keyword}</span>
          </>
        )}
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-ink">{pageTitle}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {loading
              ? "Loading products..."
              : `${pagination.total.toLocaleString()} products`}
          </p>
        </div>

        <SearchBar
          value={filters.keyword}
          onSearch={(keyword) => setFilters({ keyword })}
          className="w-full sm:max-w-md"
        />
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="w-full shrink-0 lg:w-64">
          <FilterSidebar
            filters={filters}
            facets={facets}
            onChange={setFilters}
            onReset={clearFilters}
          />
        </div>

        <div className="min-w-0 flex-1 space-y-6">
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              Sort by
              <select
                value={filters.sortBy}
                onChange={(event) => setFilters({ sortBy: event.target.value })}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-ink focus:border-cobalt-600 focus:ring-2 focus:ring-cobalt-600/20 focus:outline-none"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value || "default"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            {!loading && pagination.totalPages > 1 && (
              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={setPage}
              />
            )}
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <ProductGrid products={products} stockMap={stockMap} loading={loading} />

          {!loading && pagination.totalPages > 1 && (
            <div className="flex justify-center pt-2">
              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
