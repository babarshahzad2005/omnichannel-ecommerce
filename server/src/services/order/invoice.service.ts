import PDFDocument from "pdfkit";
import { Types } from "mongoose";
import { Order, type IAddress, type IOrder } from "../../models/order/Order";
import { Product } from "../../models/product/Product";
import { ApiError } from "../../utils/ApiError";
import { isAdminRole } from "./order.service";

type PdfDocument = InstanceType<typeof PDFDocument>;

const COMPANY_NAME = process.env.COMPANY_NAME ?? "OmniChannel E-Commerce";
const COMPANY_ADDRESS =
  process.env.COMPANY_ADDRESS ?? "123 Commerce Street, Business City, ST 10001";

interface PopulatedUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
}

type OrderForDocument = IOrder & {
  user: PopulatedUser | Types.ObjectId;
};

const formatCurrency = (amount: number): string => `$${amount.toFixed(2)}`;

const formatDate = (date: Date): string =>
  date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const renderPdfBuffer = (build: (doc: PdfDocument) => void): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    build(doc);
    doc.end();
  });

const fetchOrderForDocument = async (
  orderId: string,
  userId?: string,
  userRole?: string
): Promise<OrderForDocument> => {
  if (!Types.ObjectId.isValid(orderId)) {
    throw new ApiError(400, "Invalid order ID");
  }

  const order = (await Order.findById(orderId).populate(
    "user",
    "name email"
  )) as OrderForDocument | null;

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (userId && userRole && !isAdminRole(userRole)) {
    const orderUserId = String(order.user);

    if (orderUserId !== userId) {
      throw new ApiError(403, "You do not have access to this order");
    }
  }

  return order;
};

const writeAddress = (
  doc: PdfDocument,
  label: string,
  address: IAddress,
  x: number,
  y: number
): number => {
  doc.fontSize(11).font("Helvetica-Bold").text(label, x, y);
  doc.font("Helvetica").fontSize(10);

  let currentY = y + 16;
  doc.text(address.fullName, x, currentY);
  currentY += 14;
  doc.text(address.addressLine1, x, currentY);
  currentY += 14;

  if (address.addressLine2) {
    doc.text(address.addressLine2, x, currentY);
    currentY += 14;
  }

  doc.text(
    `${address.city}, ${address.state} ${address.postalCode}`,
    x,
    currentY
  );
  currentY += 14;
  doc.text(address.country, x, currentY);
  currentY += 14;
  doc.text(`Phone: ${address.phone}`, x, currentY);

  return currentY + 10;
};

const getProductSkuMap = async (
  order: IOrder
): Promise<Map<string, string>> => {
  const productIds = order.items.map((item) => item.product.toString());
  const products = await Product.find({ _id: { $in: productIds } }).select(
    "sku"
  );

  return new Map(products.map((product) => [product._id.toString(), product.sku]));
};

export const generateInvoice = async (
  orderId: string,
  userId?: string,
  userRole?: string
): Promise<Buffer> => {
  const order = await fetchOrderForDocument(orderId, userId, userRole);
  const billingAddress = order.billingAddress ?? order.shippingAddress;
  const customer =
    typeof order.user === "object" && "name" in order.user
      ? order.user
      : null;

  return renderPdfBuffer((doc) => {
    doc.fontSize(20).font("Helvetica-Bold").text(COMPANY_NAME, 50, 50);
    doc.fontSize(10).font("Helvetica").text(COMPANY_ADDRESS, 50, 75);

    doc.fontSize(24).font("Helvetica-Bold").text("INVOICE", 400, 50, {
      align: "right",
      width: 145,
    });

    doc.fontSize(10).font("Helvetica");
    doc.text(`Invoice #: ${order.orderNumber}`, 400, 85, {
      align: "right",
      width: 145,
    });
    doc.text(`Date: ${formatDate(order.createdAt)}`, 400, 100, {
      align: "right",
      width: 145,
    });
    doc.text(`Payment: ${order.paymentStatus}`, 400, 115, {
      align: "right",
      width: 145,
    });

    let y = 130;
    y = writeAddress(doc, "Bill To", billingAddress, 50, y);

    if (customer) {
      doc.text(`Email: ${customer.email}`, 50, y);
      y += 24;
    }

    y += 10;
    doc.font("Helvetica-Bold").fontSize(10);
    doc.text("Item", 50, y);
    doc.text("Qty", 300, y);
    doc.text("Unit Price", 360, y, { width: 80, align: "right" });
    doc.text("Subtotal", 450, y, { width: 95, align: "right" });

    y += 16;
    doc.moveTo(50, y).lineTo(545, y).stroke();
    y += 10;

    doc.font("Helvetica").fontSize(10);

    for (const item of order.items) {
      if (y > 700) {
        doc.addPage();
        y = 50;
      }

      doc.text(item.name, 50, y, { width: 230 });
      doc.text(String(item.quantity), 300, y);
      doc.text(formatCurrency(item.price), 360, y, {
        width: 80,
        align: "right",
      });
      doc.text(formatCurrency(item.subtotal), 450, y, {
        width: 95,
        align: "right",
      });

      y += 22;
    }

    y += 10;
    doc.moveTo(350, y).lineTo(545, y).stroke();
    y += 12;

    const totals: Array<[string, number]> = [
      ["Subtotal", order.subtotal],
      ["Tax", order.tax],
      ["Shipping", order.shippingCost],
      ["Discount", -order.discount],
      ["Total", order.total],
    ];

    doc.font("Helvetica");

    for (const [label, amount] of totals) {
      const isTotal = label === "Total";
      doc.font(isTotal ? "Helvetica-Bold" : "Helvetica");
      doc.text(label, 350, y);
      doc.text(formatCurrency(amount), 450, y, { width: 95, align: "right" });
      y += isTotal ? 18 : 14;
    }

    y += 20;
    doc.fontSize(10).font("Helvetica");
    doc.text(`Payment Status: ${order.paymentStatus.toUpperCase()}`, 50, y);
    doc.text(`Order Status: ${order.orderStatus.replace("_", " ")}`, 50, y + 14);
  });
};

export const generatePackingSlip = async (
  orderId: string,
  userId?: string,
  userRole?: string
): Promise<Buffer> => {
  const order = await fetchOrderForDocument(orderId, userId, userRole);
  const skuMap = await getProductSkuMap(order);

  return renderPdfBuffer((doc) => {
    doc.fontSize(20).font("Helvetica-Bold").text("PACKING SLIP", 50, 50);
    doc.fontSize(10).font("Helvetica");
    doc.text(`Order #: ${order.orderNumber}`, 50, 80);
    doc.text(`Date: ${formatDate(order.createdAt)}`, 50, 95);

    let y = 120;
    y = writeAddress(doc, "Ship To", order.shippingAddress, 50, y);

    y += 10;
    doc.font("Helvetica-Bold").fontSize(10);
    doc.text("Item", 50, y);
    doc.text("SKU", 300, y);
    doc.text("Qty", 480, y);

    y += 16;
    doc.moveTo(50, y).lineTo(545, y).stroke();
    y += 10;

    doc.font("Helvetica").fontSize(10);

    for (const item of order.items) {
      if (y > 700) {
        doc.addPage();
        y = 50;
      }

      const sku =
        skuMap.get(item.product.toString()) ?? item.variant ?? "N/A";

      doc.text(item.name, 50, y, { width: 230 });
      doc.text(sku, 300, y, { width: 160 });
      doc.text(String(item.quantity), 480, y);

      y += 22;
    }

    if (order.notes) {
      y += 20;
      doc.font("Helvetica-Bold").text("Notes:", 50, y);
      doc.font("Helvetica").text(order.notes, 50, y + 16, { width: 495 });
    }
  });
};
