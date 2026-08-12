import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../services/api";
import type { ApiResponse } from "../types/auth";
import type {
  ProductFilters,
  ProductSearchResult,
  PublicStockStatus,
  StockStatus,
} from "../types/product";

const DEFAULT_LIMIT = 12;

const DEFAULT_FILTERS: ProductFilters = {
  keyword: "",
  category: "",
  brand: "",
  minPrice: "",
  maxPrice: "",
  rating: "",
  sortBy: "",
  page: 1,
  limit: DEFAULT_LIMIT,
};

function parseFilters(params: URLSearchParams): ProductFilters {
  const page = Number(params.get("page") ?? "1");

  return {
    keyword: params.get("q") ?? "",
    category: params.get("category") ?? "",
    brand: params.get("brand") ?? "",
    minPrice: params.get("minPrice") ?? "",
    maxPrice: params.get("maxPrice") ?? "",
    rating: params.get("rating") ?? "",
    sortBy: params.get("sort") ?? "",
    page: Number.isFinite(page) && page > 0 ? page : 1,
    limit: DEFAULT_LIMIT,
  };
}

function filtersToParams(filters: ProductFilters): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.keyword) params.set("q", filters.keyword);
  if (filters.category) params.set("category", filters.category);
  if (filters.brand) params.set("brand", filters.brand);
  if (filters.minPrice) params.set("minPrice", filters.minPrice);
  if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
  if (filters.rating) params.set("rating", filters.rating);
  if (filters.sortBy) params.set("sort", filters.sortBy);
  if (filters.page > 1) params.set("page", String(filters.page));

  return params;
}

function buildSearchQuery(filters: ProductFilters): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {
    page: filters.page,
    limit: filters.limit,
    facets: true,
  };

  if (filters.keyword.trim()) query.keyword = filters.keyword.trim();
  if (filters.category) query.category = filters.category;
  if (filters.brand) query.brand = filters.brand;
  if (filters.minPrice) query.minPrice = Number(filters.minPrice);
  if (filters.maxPrice) query.maxPrice = Number(filters.maxPrice);
  if (filters.rating) query.rating = Number(filters.rating);
  if (filters.sortBy) query.sortBy = filters.sortBy;

  return query;
}

export function useProducts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => parseFilters(searchParams), [searchParams]);

  const [result, setResult] = useState<ProductSearchResult | null>(null);
  const [stockMap, setStockMap] = useState<Record<string, StockStatus>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const setFilters = useCallback(
    (updates: Partial<ProductFilters>, resetPage = true) => {
      const nextFilters = {
        ...filters,
        ...updates,
        page: resetPage ? 1 : (updates.page ?? filters.page),
      };

      setSearchParams(filtersToParams(nextFilters), { replace: true });
    },
    [filters, setSearchParams]
  );

  const resetFilters = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

  const setPage = useCallback(
    (page: number) => {
      setFilters({ page }, false);
    },
    [setFilters]
  );

  useEffect(() => {
    let cancelled = false;

    const fetchProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get<ApiResponse<ProductSearchResult>>(
          "/products/search",
          { params: buildSearchQuery(filters) }
        );

        if (cancelled) return;

        const data = response.data.data ?? {
          products: [],
          pagination: { page: 1, limit: DEFAULT_LIMIT, total: 0, totalPages: 1 },
        };

        setResult(data);

        if (data.products.length > 0) {
          const productIds = data.products.map((product) => product._id).join(",");
          const stockResponse = await api.get<ApiResponse<PublicStockStatus[]>>(
            "/inventory/public/status",
            { params: { productIds } }
          );

          if (!cancelled) {
            const statuses = stockResponse.data.data ?? [];
            setStockMap(
              statuses.reduce<Record<string, StockStatus>>((acc, item) => {
                acc[item.productId] = item.status;
                return acc;
              }, {})
            );
          }
        } else {
          setStockMap({});
        }
      } catch {
        if (!cancelled) {
          setError("Failed to load products");
          setResult(null);
          setStockMap({});
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchProducts();

    return () => {
      cancelled = true;
    };
  }, [filters]);

  return {
    filters,
    products: result?.products ?? [],
    facets: result?.facets,
    pagination: result?.pagination ?? {
      page: filters.page,
      limit: filters.limit,
      total: 0,
      totalPages: 1,
    },
    stockMap,
    loading,
    error,
    setFilters,
    resetFilters,
    setPage,
    defaultFilters: DEFAULT_FILTERS,
  };
}
