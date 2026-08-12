import api from "./api";
import type { ApiResponse } from "../types/auth";
import type {
  AdminCategory,
  AdminCoupon,
  AdminCustomer,
  AdminInventoryItem,
  AdminOrder,
  AdminProduct,
  CustomerStats,
  InventoryReport,
  LowStockItem,
  OrderStatus,
  PaginatedOrders,
  Pagination,
  RevenueChartPoint,
  SalesOverview,
} from "../types/admin";

interface DateRangeParams {
  startDate?: string;
  endDate?: string;
}

export async function fetchSalesOverview(
  params?: DateRangeParams & { period?: string }
): Promise<SalesOverview> {
  const response = await api.get<ApiResponse<SalesOverview>>(
    "/admin/analytics/sales-overview",
    { params }
  );
  return (
    response.data.data ?? {
      totalRevenue: 0,
      totalOrders: 0,
      avgOrderValue: 0,
      statusBreakdown: [],
      periodBuckets: [],
    }
  );
}

export async function fetchRevenueChart(
  params?: DateRangeParams & { granularity?: string }
): Promise<RevenueChartPoint[]> {
  const response = await api.get<ApiResponse<RevenueChartPoint[]>>(
    "/admin/analytics/revenue-chart",
    { params }
  );
  return response.data.data ?? [];
}

export async function fetchCustomerStats(
  params?: DateRangeParams
): Promise<CustomerStats> {
  const response = await api.get<ApiResponse<CustomerStats>>(
    "/admin/analytics/customer-stats",
    { params }
  );
  return (
    response.data.data ?? {
      totalCustomers: 0,
      newCustomers: 0,
      customersWithOrders: 0,
      repeatCustomers: 0,
      repeatRate: 0,
    }
  );
}

export async function fetchTopProducts(
  params?: DateRangeParams & { limit?: number }
): Promise<
  {
    productId: string;
    name: string;
    totalRevenue: number;
    totalQuantity: number;
    orderCount: number;
  }[]
> {
  const response = await api.get<
    ApiResponse<
      {
        productId: string;
        name: string;
        totalRevenue: number;
        totalQuantity: number;
        orderCount: number;
      }[]
    >
  >("/admin/analytics/top-products", { params });
  return response.data.data ?? [];
}

export async function fetchInventoryReport(): Promise<InventoryReport> {
  const response = await api.get<ApiResponse<InventoryReport>>(
    "/admin/analytics/inventory-report"
  );
  return (
    response.data.data ?? {
      totalSkus: 0,
      lowStock: 0,
      outOfStock: 0,
      totalValue: 0,
    }
  );
}

export async function fetchAdminOrders(params?: {
  page?: number;
  limit?: number;
  orderStatus?: OrderStatus;
  paymentStatus?: string;
}): Promise<PaginatedOrders> {
  const response = await api.get<ApiResponse<PaginatedOrders>>("/admin/orders", {
    params,
  });
  return (
    response.data.data ?? {
      orders: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
    }
  );
}

export async function fetchAdminOrder(orderId: string): Promise<AdminOrder> {
  const response = await api.get<ApiResponse<AdminOrder>>(`/orders/${orderId}`);
  if (!response.data.data) {
    throw new Error("Order not found");
  }
  return response.data.data;
}

export async function updateOrderStatus(
  orderId: string,
  payload: {
    orderStatus: OrderStatus;
    cancelReason?: string;
    tracking?: { description?: string; location?: string };
  }
): Promise<AdminOrder> {
  const response = await api.put<ApiResponse<AdminOrder>>(
    `/admin/orders/${orderId}/status`,
    payload
  );
  if (!response.data.data) {
    throw new Error("Failed to update order");
  }
  return response.data.data;
}

export function downloadAdminInvoice(orderId: string): void {
  window.open(`/api/admin/orders/${orderId}/invoice`, "_blank");
}

export function downloadPackingSlip(orderId: string): void {
  window.open(`/api/orders/${orderId}/packing-slip`, "_blank");
}

export async function fetchProducts(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<{ products: AdminProduct[]; pagination: Pagination }> {
  const response = await api.get<
    ApiResponse<{ products: AdminProduct[]; pagination: Pagination }>
  >("/products", { params: { ...params, limit: params?.limit ?? 50 } });
  return (
    response.data.data ?? {
      products: [],
      pagination: { page: 1, limit: 50, total: 0, totalPages: 1 },
    }
  );
}

export async function createProduct(
  payload: Record<string, unknown>
): Promise<AdminProduct> {
  const response = await api.post<ApiResponse<AdminProduct>>("/products", payload);
  if (!response.data.data) throw new Error("Failed to create product");
  return response.data.data;
}

export async function updateProduct(
  id: string,
  payload: Record<string, unknown>
): Promise<AdminProduct> {
  const response = await api.put<ApiResponse<AdminProduct>>(
    `/products/${id}`,
    payload
  );
  if (!response.data.data) throw new Error("Failed to update product");
  return response.data.data;
}

export async function deleteProduct(id: string): Promise<void> {
  await api.delete(`/products/${id}`);
}

export async function fetchCategories(): Promise<AdminCategory[]> {
  const response = await api.get<ApiResponse<AdminCategory[]>>("/categories");
  return response.data.data ?? [];
}

export async function createCategory(
  payload: Record<string, unknown>
): Promise<AdminCategory> {
  const response = await api.post<ApiResponse<AdminCategory>>("/categories", payload);
  if (!response.data.data) throw new Error("Failed to create category");
  return response.data.data;
}

export async function updateCategory(
  id: string,
  payload: Record<string, unknown>
): Promise<AdminCategory> {
  const response = await api.put<ApiResponse<AdminCategory>>(
    `/categories/${id}`,
    payload
  );
  if (!response.data.data) throw new Error("Failed to update category");
  return response.data.data;
}

export async function deleteCategory(id: string): Promise<void> {
  await api.delete(`/categories/${id}`);
}

export async function fetchInventory(params?: {
  page?: number;
  limit?: number;
}): Promise<{ inventory: AdminInventoryItem[]; pagination: Pagination }> {
  const response = await api.get<
    ApiResponse<{ inventory: AdminInventoryItem[]; pagination: Pagination }>
  >("/inventory", { params });
  return (
    response.data.data ?? {
      inventory: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
    }
  );
}

export async function fetchLowStock(): Promise<LowStockItem[]> {
  const response = await api.get<ApiResponse<LowStockItem[]>>("/inventory/low-stock");
  return response.data.data ?? [];
}

export async function restockInventory(payload: {
  productId: string;
  qty: number;
  warehouse?: string;
}): Promise<void> {
  await api.post("/inventory/restock", payload);
}

export async function fetchCoupons(): Promise<AdminCoupon[]> {
  const response = await api.get<ApiResponse<AdminCoupon[]>>("/admin/coupons");
  return response.data.data ?? [];
}

export async function createCoupon(
  payload: Record<string, unknown>
): Promise<AdminCoupon> {
  const response = await api.post<ApiResponse<AdminCoupon>>("/admin/coupons", payload);
  if (!response.data.data) throw new Error("Failed to create coupon");
  return response.data.data;
}

export async function updateCoupon(
  id: string,
  payload: Record<string, unknown>
): Promise<AdminCoupon> {
  const response = await api.put<ApiResponse<AdminCoupon>>(
    `/admin/coupons/${id}`,
    payload
  );
  if (!response.data.data) throw new Error("Failed to update coupon");
  return response.data.data;
}

export async function deleteCoupon(id: string): Promise<void> {
  await api.delete(`/admin/coupons/${id}`);
}

export async function fetchCustomersFromOrders(): Promise<AdminCustomer[]> {
  const { orders } = await fetchAdminOrders({ page: 1, limit: 100 });
  const customerMap = new Map<string, AdminCustomer>();

  orders.forEach((order) => {
    if (typeof order.user === "string") return;
    const existing = customerMap.get(order.user._id);
    if (existing) {
      existing.orderCount += 1;
      existing.totalSpent += order.total;
    } else {
      customerMap.set(order.user._id, {
        _id: order.user._id,
        name: order.user.name,
        email: order.user.email,
        orderCount: 1,
        totalSpent: order.total,
        createdAt: order.createdAt,
      });
    }
  });

  return [...customerMap.values()].sort((a, b) => b.totalSpent - a.totalSpent);
}
