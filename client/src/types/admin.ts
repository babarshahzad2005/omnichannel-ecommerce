export type OrderStatus =
  | "pending_payment"
  | "processing"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export type PaymentMethod = "stripe" | "paypal" | "cod";

export interface SalesOverview {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  statusBreakdown: {
    status: OrderStatus;
    count: number;
    revenue: number;
  }[];
  periodBuckets: {
    periodStart: string;
    periodEnd: string;
    revenue: number;
    orders: number;
  }[];
}

export interface RevenueChartPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface CustomerStats {
  totalCustomers: number;
  newCustomers: number;
  customersWithOrders: number;
  repeatCustomers: number;
  repeatRate: number;
}

export interface InventoryReport {
  totalSkus: number;
  lowStock: number;
  outOfStock: number;
  totalValue: number;
}

export interface OrderUser {
  _id: string;
  name: string;
  email: string;
}

export interface OrderItem {
  product: string;
  name: string;
  price: number;
  quantity: number;
  variant?: string;
  image?: string;
  subtotal: number;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface TrackingEvent {
  status: string;
  timestamp: string;
  description?: string;
  location?: string;
}

export interface AdminOrder {
  _id: string;
  orderNumber: string;
  user: OrderUser | string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  billingAddress?: ShippingAddress;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  subtotal: number;
  tax: number;
  shippingCost: number;
  discount: number;
  total: number;
  couponCode?: string;
  notes?: string;
  trackingInfo: TrackingEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedOrders {
  orders: AdminOrder[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminProduct {
  _id: string;
  name: string;
  slug: string;
  sku: string;
  brand?: string;
  category: { _id: string; name: string } | string;
  price: number;
  compareAtPrice?: number;
  isActive: boolean;
  isFeatured: boolean;
  averageRating: number;
  reviewCount: number;
  createdAt: string;
}

export interface AdminCategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  parent?: string;
  image?: string;
  isActive: boolean;
  createdAt: string;
}

export interface AdminInventoryItem {
  _id: string;
  product: {
    _id: string;
    name: string;
    sku: string;
    price?: number;
  };
  warehouse: string;
  quantity: number;
  reservedQty: number;
  reorderLevel: number;
}

export interface AdminCoupon {
  _id: string;
  code: string;
  description?: string;
  discountType: "percentage" | "fixed" | "bogo" | "free_shipping";
  discountValue: number;
  minOrderAmount: number;
  maxUses?: number;
  usedCount: number;
  maxUsesPerUser: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
}

export interface AdminCustomer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  orderCount: number;
  totalSpent: number;
  createdAt: string;
}

export interface LowStockItem {
  _id: string;
  product: { _id: string; name: string; sku: string };
  warehouse: string;
  quantity: number;
  reservedQty: number;
  reorderLevel: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
