import type { ProductFilters, SearchFacets } from "../../types/product";

interface FilterSidebarProps {
  filters: ProductFilters;
  facets?: SearchFacets;
  onChange: (updates: Partial<ProductFilters>) => void;
  onReset: () => void;
}

const RATING_OPTIONS = [
  { value: "4", label: "4 & up" },
  { value: "3", label: "3 & up" },
  { value: "2", label: "2 & up" },
  { value: "1", label: "1 & up" },
];

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-slate-100 pb-5 last:border-b-0 last:pb-0">
      <h3 className="mb-3 text-sm font-semibold text-ink">{title}</h3>
      {children}
    </div>
  );
}

export default function FilterSidebar({
  filters,
  facets,
  onChange,
  onReset,
}: FilterSidebarProps) {
  const hasActiveFilters =
    filters.category ||
    filters.brand ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.rating;

  return (
    <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-base font-semibold text-ink">Filters</h2>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-medium text-cobalt-600 hover:text-cobalt-700"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="space-y-5">
        <FilterSection title="Category">
          <div className="max-h-48 space-y-2 overflow-y-auto">
            {(facets?.categories ?? []).map((category) => (
              <label
                key={category.id}
                className="flex cursor-pointer items-center justify-between gap-2 text-sm"
              >
                <span className="flex items-center gap-2 text-slate-700">
                  <input
                    type="radio"
                    name="category"
                    checked={filters.category === category.id}
                    onChange={() =>
                      onChange({
                        category: filters.category === category.id ? "" : category.id,
                      })
                    }
                    className="h-4 w-4 border-slate-300 text-cobalt-600 focus:ring-cobalt-600"
                  />
                  {category.name}
                </span>
                <span className="text-xs text-slate-400">{category.count}</span>
              </label>
            ))}
            {!facets?.categories?.length && (
              <p className="text-sm text-slate-400">No categories available</p>
            )}
          </div>
        </FilterSection>

        <FilterSection title="Price">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="minPrice" className="mb-1 block text-xs text-slate-500">
                Min
              </label>
              <input
                id="minPrice"
                type="number"
                min={0}
                value={filters.minPrice}
                onChange={(event) => onChange({ minPrice: event.target.value })}
                placeholder="$0"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-cobalt-600 focus:ring-2 focus:ring-cobalt-600/20 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="maxPrice" className="mb-1 block text-xs text-slate-500">
                Max
              </label>
              <input
                id="maxPrice"
                type="number"
                min={0}
                value={filters.maxPrice}
                onChange={(event) => onChange({ maxPrice: event.target.value })}
                placeholder="$1000"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-cobalt-600 focus:ring-2 focus:ring-cobalt-600/20 focus:outline-none"
              />
            </div>
          </div>
          {(facets?.priceRanges ?? []).length > 0 && (
            <div className="mt-3 space-y-1">
              {facets?.priceRanges.map((range) => {
                const label =
                  range.max !== null
                    ? `$${range.min} – $${range.max}`
                    : `$${range.min}+`;

                return (
                  <button
                    key={`${range.min}-${range.max}`}
                    type="button"
                    onClick={() =>
                      onChange({
                        minPrice: String(range.min),
                        maxPrice: range.max !== null ? String(range.max) : "",
                      })
                    }
                    className="block w-full rounded-md px-2 py-1.5 text-left text-xs text-slate-600 hover:bg-slate-50"
                  >
                    {label}
                    <span className="ml-1 text-slate-400">({range.count})</span>
                  </button>
                );
              })}
            </div>
          )}
        </FilterSection>

        <FilterSection title="Brand">
          <div className="max-h-40 space-y-2 overflow-y-auto">
            {(facets?.brands ?? []).map((brandFacet) => (
              <label
                key={brandFacet.brand}
                className="flex cursor-pointer items-center justify-between gap-2 text-sm"
              >
                <span className="flex items-center gap-2 text-slate-700">
                  <input
                    type="radio"
                    name="brand"
                    checked={filters.brand === brandFacet.brand}
                    onChange={() =>
                      onChange({
                        brand:
                          filters.brand === brandFacet.brand ? "" : brandFacet.brand,
                      })
                    }
                    className="h-4 w-4 border-slate-300 text-cobalt-600 focus:ring-cobalt-600"
                  />
                  {brandFacet.brand}
                </span>
                <span className="text-xs text-slate-400">{brandFacet.count}</span>
              </label>
            ))}
            {!facets?.brands?.length && (
              <p className="text-sm text-slate-400">No brands available</p>
            )}
          </div>
        </FilterSection>

        <FilterSection title="Rating">
          <div className="space-y-2">
            {RATING_OPTIONS.map((option) => {
              const facetCount = facets?.ratingDistribution
                .filter((item) => item.rating >= Number(option.value))
                .reduce((sum, item) => sum + item.count, 0);

              return (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-center justify-between gap-2 text-sm"
                >
                  <span className="flex items-center gap-2 text-slate-700">
                    <input
                      type="radio"
                      name="rating"
                      checked={filters.rating === option.value}
                      onChange={() =>
                        onChange({
                          rating:
                            filters.rating === option.value ? "" : option.value,
                        })
                      }
                      className="h-4 w-4 border-slate-300 text-cobalt-600 focus:ring-cobalt-600"
                    />
                    {option.label}
                  </span>
                  {facetCount !== undefined && (
                    <span className="text-xs text-slate-400">{facetCount}</span>
                  )}
                </label>
              );
            })}
          </div>
        </FilterSection>
      </div>
    </aside>
  );
}
