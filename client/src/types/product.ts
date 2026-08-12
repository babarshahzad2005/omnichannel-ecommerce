export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export interface ProductCategory {
  _id: string;
  name: string;
  slug: string;
}

export interface ProductImage {
  url: string;
  alt?: string;
  isPrimary: boolean;
}

export interface VariantOption {
  name: string;
  sku: string;
  price: number;
  stock: number;
}

export interface ProductVariant {
  type: string;
  options: VariantOption[];
}

export interface ProductAttribute {
  key: string;
  value: string;
}

export interface ProductVendor {
  _id: string;
  name: string;
  email?: string;
  role?: string;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  richDescription?: string;
  sku: string;
  brand?: string;
  category: ProductCategory | string;
  price: number;
  compareAtPrice?: number;
  variants: ProductVariant[];
  attributes: ProductAttribute[];
  images: ProductImage[];
  tags: string[];
  averageRating: number;
  reviewCount: number;
  totalSold: number;
  isFeatured: boolean;
  isActive: boolean;
  createdBy?: ProductVendor;
  createdAt?: string;
}

export interface PriceRangeFacet {
  min: number;
  max: number | null;
  count: number;
}

export interface CategoryFacet {
  id: string;
  name: string;
  count: number;
}

export interface BrandFacet {
  brand: string;
  count: number;
}

export interface RatingFacet {
  rating: number;
  count: number;
}

export interface SearchFacets {
  priceRanges: PriceRangeFacet[];
  categories: CategoryFacet[];
  brands: BrandFacet[];
  ratingDistribution: RatingFacet[];
}

export interface SearchPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ProductSearchResult {
  products: Product[];
  pagination: SearchPagination;
  facets?: SearchFacets;
}

export interface ProductFilters {
  keyword: string;
  category: string;
  brand: string;
  minPrice: string;
  maxPrice: string;
  rating: string;
  sortBy: string;
  page: number;
  limit: number;
}

export interface PublicStockStatus {
  productId: string;
  status: StockStatus;
}

export interface ReviewUser {
  _id: string;
  name: string;
  avatar?: string;
}

export interface Review {
  _id: string;
  product: string;
  user: ReviewUser;
  rating: number;
  title?: string;
  comment?: string;
  images: string[];
  isVerifiedPurchase: boolean;
  isApproved: boolean;
  likes: number;
  createdAt: string;
}

export interface ReviewsResult {
  reviews: Review[];
  pagination: SearchPagination;
}
