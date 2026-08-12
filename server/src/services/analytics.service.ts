import { Types } from "mongoose";
import { Inventory } from "../models/inventory/Inventory";
import { Order, type OrderStatus } from "../models/order/Order";
import { User } from "../models/user/User";
import { ApiError } from "../utils/ApiError";
import { withAnalyticsCache } from "../utils/analyticsCache";

export interface AnalyticsDateRange {
  startDate?: Date;
  endDate?: Date;
}

export interface SalesOverviewQuery extends AnalyticsDateRange {
  period?: "day" | "week" | "month";
}

export interface TopProductsQuery extends AnalyticsDateRange {
  limit?: number;
}

export interface RevenueChartQuery extends AnalyticsDateRange {
  granularity?: "day" | "week" | "month";
}

const roundMoney = (value: number): number =>
  Math.round(value * 100) / 100;

const parseDateRange = (query: AnalyticsDateRange): {
  startDate?: Date;
  endDate?: Date;
} => {
  const startDate = query.startDate ? new Date(query.startDate) : undefined;
  const endDate = query.endDate ? new Date(query.endDate) : undefined;

  if (startDate && Number.isNaN(startDate.getTime())) {
    throw new ApiError(400, "Invalid startDate");
  }

  if (endDate && Number.isNaN(endDate.getTime())) {
    throw new ApiError(400, "Invalid endDate");
  }

  if (startDate && endDate && startDate > endDate) {
    throw new ApiError(400, "startDate must be before endDate");
  }

  return { startDate, endDate };
};

const buildCreatedAtMatch = (
  startDate?: Date,
  endDate?: Date
): Record<string, unknown> => {
  const match: Record<string, unknown> = {
    orderStatus: { $ne: "cancelled" },
  };

  if (startDate || endDate) {
    const createdAt: Record<string, Date> = {};

    if (startDate) {
      createdAt.$gte = startDate;
    }

    if (endDate) {
      createdAt.$lte = endDate;
    }

    match.createdAt = createdAt;
  }

  return match;
};

const getDateFormat = (granularity: "day" | "week" | "month"): string => {
  switch (granularity) {
    case "week":
      return "%Y-%U";
    case "month":
      return "%Y-%m";
    default:
      return "%Y-%m-%d";
  }
};

const buildPeriodBoundaries = (
  startDate: Date,
  endDate: Date,
  period: "day" | "week" | "month"
): Date[] => {
  const boundaries: Date[] = [];
  const cursor = new Date(startDate);

  while (cursor <= endDate) {
    boundaries.push(new Date(cursor));

    if (period === "day") {
      cursor.setDate(cursor.getDate() + 1);
    } else if (period === "week") {
      cursor.setDate(cursor.getDate() + 7);
    } else {
      cursor.setMonth(cursor.getMonth() + 1);
    }
  }

  boundaries.push(new Date(endDate.getTime() + 1));
  return boundaries;
};

const fetchSalesOverview = async (query: SalesOverviewQuery) => {
  const { startDate, endDate } = parseDateRange(query);
  const match = buildCreatedAtMatch(startDate, endDate);

  const [summary, statusBreakdown] = await Promise.all([
    Order.aggregate<{
      totalRevenue: number;
      totalOrders: number;
    }>([
      { $match: match },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$total" },
          totalOrders: { $sum: 1 },
        },
      },
    ]),
    Order.aggregate<{ _id: OrderStatus; count: number; revenue: number }>([
      { $match: match },
      {
        $group: {
          _id: "$orderStatus",
          count: { $sum: 1 },
          revenue: { $sum: "$total" },
        },
      },
      { $sort: { count: -1 } },
    ]),
  ]);

  const totals = summary[0] ?? { totalRevenue: 0, totalOrders: 0 };
  const avgOrderValue =
    totals.totalOrders > 0
      ? roundMoney(totals.totalRevenue / totals.totalOrders)
      : 0;

  let periodBuckets: Array<{
    periodStart: Date;
    periodEnd: Date | string;
    revenue: number;
    orders: number;
  }> = [];

  if (query.period && startDate && endDate) {
    const boundaries = buildPeriodBoundaries(startDate, endDate, query.period);

    periodBuckets = await Order.aggregate([
      { $match: match },
      {
        $bucket: {
          groupBy: "$createdAt",
          boundaries,
          default: "other",
          output: {
            revenue: { $sum: "$total" },
            orders: { $sum: 1 },
          },
        },
      },
      {
        $project: {
          periodStart: "$_id",
          periodEnd: "$_id",
          revenue: 1,
          orders: 1,
          _id: 0,
        },
      },
    ]);
  }

  return {
    totalRevenue: roundMoney(totals.totalRevenue),
    totalOrders: totals.totalOrders,
    avgOrderValue,
    statusBreakdown: statusBreakdown.map((item) => ({
      status: item._id,
      count: item.count,
      revenue: roundMoney(item.revenue),
    })),
    periodBuckets,
  };
};

const fetchTopProducts = async (query: TopProductsQuery) => {
  const { startDate, endDate } = parseDateRange(query);
  const limit = Math.min(Math.max(query.limit ?? 10, 1), 50);
  const match = buildCreatedAtMatch(startDate, endDate);

  const products = await Order.aggregate([
    { $match: match },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.product",
        name: { $first: "$items.name" },
        totalRevenue: { $sum: "$items.subtotal" },
        totalQuantity: { $sum: "$items.quantity" },
        orderCount: { $sum: 1 },
      },
    },
    { $sort: { totalRevenue: -1 } },
    { $limit: limit },
    {
      $project: {
        productId: "$_id",
        name: 1,
        totalRevenue: { $round: ["$totalRevenue", 2] },
        totalQuantity: 1,
        orderCount: 1,
        _id: 0,
      },
    },
  ]);

  return products;
};

const fetchRevenueChart = async (query: RevenueChartQuery) => {
  const { startDate, endDate } = parseDateRange(query);
  const granularity = query.granularity ?? "day";
  const match = buildCreatedAtMatch(startDate, endDate);

  const chartData = await Order.aggregate<{
    date: string;
    revenue: number;
    orders: number;
  }>([
    { $match: match },
    {
      $group: {
        _id: {
          $dateToString: {
            format: getDateFormat(granularity),
            date: "$createdAt",
          },
        },
        revenue: { $sum: "$total" },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        date: "$_id",
        revenue: { $round: ["$revenue", 2] },
        orders: 1,
        _id: 0,
      },
    },
  ]);

  return chartData;
};

const fetchCustomerStats = async (query: AnalyticsDateRange) => {
  const { startDate, endDate } = parseDateRange(query);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const newCustomerFilter: Record<string, unknown> = {
    role: "customer",
    isActive: true,
  };

  if (startDate || endDate) {
    newCustomerFilter.createdAt = {};
    if (startDate) {
      (newCustomerFilter.createdAt as Record<string, Date>).$gte = startDate;
    }
    if (endDate) {
      (newCustomerFilter.createdAt as Record<string, Date>).$lte = endDate;
    }
  } else {
    newCustomerFilter.createdAt = { $gte: monthStart };
  }

  const orderMatch = buildCreatedAtMatch(startDate, endDate);

  const [totalCustomers, newCustomers, orderUsers] = await Promise.all([
    User.countDocuments({ role: "customer", isActive: true }),
    User.countDocuments(newCustomerFilter),
    Order.aggregate<{ _id: Types.ObjectId; orderCount: number }>([
      { $match: orderMatch },
      {
        $group: {
          _id: "$user",
          orderCount: { $sum: 1 },
        },
      },
    ]),
  ]);

  const customersWithOrders = orderUsers.length;
  const repeatCustomers = orderUsers.filter((user) => user.orderCount > 1).length;
  const repeatRate =
    customersWithOrders > 0
      ? roundMoney((repeatCustomers / customersWithOrders) * 100)
      : 0;

  return {
    totalCustomers,
    newCustomers,
    customersWithOrders,
    repeatCustomers,
    repeatRate,
  };
};

const fetchInventoryReport = async () => {
  const [report] = await Inventory.aggregate<{
    totalSkus: number;
    lowStock: number;
    outOfStock: number;
    totalValue: number;
  }>([
    {
      $lookup: {
        from: "products",
        localField: "product",
        foreignField: "_id",
        as: "productInfo",
      },
    },
    { $unwind: "$productInfo" },
    {
      $addFields: {
        availableQty: { $subtract: ["$quantity", "$reservedQty"] },
        unitCost: {
          $ifNull: ["$productInfo.costPrice", "$productInfo.price"],
        },
      },
    },
    {
      $group: {
        _id: null,
        totalSkus: { $sum: 1 },
        lowStock: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $gt: ["$availableQty", 0] },
                  { $lte: ["$availableQty", "$reorderLevel"] },
                ],
              },
              1,
              0,
            ],
          },
        },
        outOfStock: {
          $sum: {
            $cond: [{ $lte: ["$availableQty", 0] }, 1, 0],
          },
        },
        totalValue: {
          $sum: { $multiply: ["$quantity", "$unitCost"] },
        },
      },
    },
    {
      $project: {
        _id: 0,
        totalSkus: 1,
        lowStock: 1,
        outOfStock: 1,
        totalValue: { $round: ["$totalValue", 2] },
      },
    },
  ]);

  return (
    report ?? {
      totalSkus: 0,
      lowStock: 0,
      outOfStock: 0,
      totalValue: 0,
    }
  );
};

export const getSalesOverview = (query: SalesOverviewQuery) =>
  withAnalyticsCache("sales-overview", query, () => fetchSalesOverview(query));

export const getTopProducts = (query: TopProductsQuery) =>
  withAnalyticsCache("top-products", query, () => fetchTopProducts(query));

export const getRevenueChart = (query: RevenueChartQuery) =>
  withAnalyticsCache("revenue-chart", query, () => fetchRevenueChart(query));

export const getCustomerStats = (query: AnalyticsDateRange) =>
  withAnalyticsCache("customer-stats", query, () => fetchCustomerStats(query));

export const getInventoryReport = (query: AnalyticsDateRange) =>
  withAnalyticsCache("inventory-report", query, () => fetchInventoryReport());
