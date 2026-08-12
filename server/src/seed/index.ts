import dotenv from "dotenv";
import mongoose from "mongoose";
import { Coupon } from "../models/coupon/Coupon";
import { Inventory } from "../models/inventory/Inventory";
import { StockReservation } from "../models/inventory/StockReservation";
import { Notification } from "../models/Notification";
import { Order, type IAddress, type OrderStatus } from "../models/order/Order";
import { Category } from "../models/product/Category";
import { Product } from "../models/product/Product";
import { Review } from "../models/product/Review";
import { User } from "../models/user/User";

dotenv.config();

const SEED_PASSWORD = "Password123!";

const PLACEHOLDER_IMAGE = (seed: string) =>
  `https://picsum.photos/seed/${seed}/800/800`;

const SAMPLE_ADDRESS: IAddress = {
  fullName: "Jordan Lee",
  phone: "+1 (917) 555-0198",
  addressLine1: "123 Atlantic Ave",
  addressLine2: "Apt 4B",
  city: "Brooklyn",
  state: "NY",
  postalCode: "11201",
  country: "United States",
};

const randomInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const roundMoney = (value: number): number =>
  Math.round(value * 100) / 100;

async function connectDatabase(): Promise<void> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error("MONGODB_URI is required to run the seeder");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("  Connected to MongoDB");
}

async function clearCollections(): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    console.error("Refusing to clear collections in production");
    process.exit(1);
  }

  await Promise.all([
    StockReservation.deleteMany({}),
    Review.deleteMany({}),
    Notification.deleteMany({}),
    Order.deleteMany({}),
    Inventory.deleteMany({}),
    Coupon.deleteMany({}),
    Product.deleteMany({}),
    Category.deleteMany({}),
    User.deleteMany({}),
  ]);

  console.log("  Cleared existing collections");
}

async function seedUsers() {
  const users = await User.create([
    {
      name: "Alex Admin",
      email: "admin@omnichannel.com",
      password: SEED_PASSWORD,
      role: "superAdmin",
      phone: "+1 (212) 555-0100",
    },
    {
      name: "Vendor Manager",
      email: "vendor@omnichannel.com",
      password: SEED_PASSWORD,
      role: "vendorManager",
      phone: "+1 (212) 555-0101",
    },
    {
      name: "Jordan Customer",
      email: "customer@omnichannel.com",
      password: SEED_PASSWORD,
      role: "customer",
      phone: "+1 (917) 555-0198",
    },
  ]);

  console.log(`  Created ${users.length} users`);
  return users;
}

async function seedCategories() {
  const categoryDefinitions = [
    {
      name: "Electronics",
      description: "Consumer electronics and gadgets",
      subcategories: [
        { name: "Audio", description: "Headphones, speakers, and audio gear" },
        { name: "Computers", description: "Laptops, desktops, and accessories" },
      ],
    },
    {
      name: "Fashion",
      description: "Clothing, footwear, and accessories",
      subcategories: [
        { name: "Men", description: "Men's apparel and shoes" },
        { name: "Women", description: "Women's apparel and shoes" },
      ],
    },
    {
      name: "Home",
      description: "Home essentials and appliances",
      subcategories: [
        { name: "Kitchen", description: "Cookware and kitchen appliances" },
        { name: "Decor", description: "Furniture and home decor" },
      ],
    },
    {
      name: "Sports",
      description: "Fitness and outdoor equipment",
      subcategories: [
        { name: "Fitness", description: "Gym and training gear" },
        { name: "Outdoor", description: "Camping, hiking, and outdoor sports" },
      ],
    },
    {
      name: "Beauty",
      description: "Skincare, makeup, and personal care",
      subcategories: [
        { name: "Skincare", description: "Moisturizers, serums, and cleansers" },
        { name: "Personal Care", description: "Oral care and grooming" },
      ],
    },
  ];

  const categories: Record<string, mongoose.Types.ObjectId> = {};

  for (const parentDef of categoryDefinitions) {
    const parent = await Category.create({
      name: parentDef.name,
      description: parentDef.description,
      image: PLACEHOLDER_IMAGE(`cat-${parentDef.name}`),
      isActive: true,
    });

    categories[parentDef.name] = parent._id;

    for (const subDef of parentDef.subcategories) {
      const sub = await Category.create({
        name: subDef.name,
        description: subDef.description,
        parent: parent._id,
        image: PLACEHOLDER_IMAGE(`cat-${parentDef.name}-${subDef.name}`),
        isActive: true,
      });

      categories[`${parentDef.name}/${subDef.name}`] = sub._id;
    }
  }

  console.log(`  Created ${Object.keys(categories).length} categories`);
  return categories;
}

interface ProductSeed {
  name: string;
  sku: string;
  brand: string;
  categoryKey: string;
  price: number;
  compareAtPrice?: number;
  description: string;
  tags: string[];
  isFeatured?: boolean;
  averageRating?: number;
  reviewCount?: number;
  totalSold?: number;
  variants?: {
    type: string;
    options: { name: string; sku: string; price: number; stock: number }[];
  }[];
  attributes?: { key: string; value: string }[];
}

const PRODUCT_SEEDS: ProductSeed[] = [
  {
    name: "Sony WH-1000XM5",
    sku: "SONY-XM5-BLK",
    brand: "Sony",
    categoryKey: "Electronics/Audio",
    price: 349.99,
    compareAtPrice: 399.99,
    description: "Industry-leading noise canceling wireless headphones with 30-hour battery life.",
    tags: ["headphones", "wireless", "noise-canceling"],
    isFeatured: true,
    averageRating: 4.8,
    reviewCount: 1254,
    totalSold: 890,
    variants: [
      {
        type: "Color",
        options: [
          { name: "Black", sku: "SONY-XM5-BLK", price: 349.99, stock: 45 },
          { name: "Silver", sku: "SONY-XM5-SLV", price: 349.99, stock: 32 },
        ],
      },
    ],
    attributes: [
      { key: "Battery Life", value: "Up to 30 hours" },
      { key: "Connectivity", value: "Bluetooth 5.2" },
    ],
  },
  {
    name: "Bose QuietComfort 45",
    sku: "BOSE-QC45-BLK",
    brand: "Bose",
    categoryKey: "Electronics/Audio",
    price: 279.0,
    compareAtPrice: 329.0,
    description: "Legendary comfort and balanced sound with world-class noise cancellation.",
    tags: ["headphones", "bose", "audio"],
    averageRating: 4.6,
    reviewCount: 982,
    totalSold: 640,
  },
  {
    name: "Apple AirPods Pro (2nd Gen)",
    sku: "APPLE-APP2-WHT",
    brand: "Apple",
    categoryKey: "Electronics/Audio",
    price: 249.0,
    description: "Active Noise Cancellation, Adaptive Audio, and personalized Spatial Audio.",
    tags: ["earbuds", "apple", "wireless"],
    isFeatured: true,
    averageRating: 4.7,
    reviewCount: 2103,
    totalSold: 1520,
  },
  {
    name: "Samsung Galaxy Buds2 Pro",
    sku: "SAM-BUDS2-PRO",
    brand: "Samsung",
    categoryKey: "Electronics/Audio",
    price: 199.99,
    compareAtPrice: 229.99,
    description: "Intelligent 360 audio with enhanced ANC for Galaxy ecosystem users.",
    tags: ["earbuds", "samsung"],
    averageRating: 4.4,
    reviewCount: 567,
    totalSold: 410,
  },
  {
    name: "Samsung Galaxy Buds2 Pro",
    sku: "APPLE-MBP14-M3",
    brand: "Apple",
    categoryKey: "Electronics/Computers",
    price: 1599.0,
    description: "Supercharged by M3 chip for pro workflows with stunning Liquid Retina XDR display.",
    tags: ["laptop", "apple", "macbook"],
    isFeatured: true,
    averageRating: 4.9,
    reviewCount: 432,
    totalSold: 198,
    attributes: [
      { key: "Processor", value: "Apple M3" },
      { key: "Memory", value: "16GB unified" },
      { key: "Storage", value: "512GB SSD" },
    ],
  },
  {
    name: "Dell XPS 15",
    sku: "DELL-XPS15",
    brand: "Dell",
    categoryKey: "Electronics/Computers",
    price: 1399.99,
    compareAtPrice: 1599.99,
    description: "Premium 15-inch laptop with InfinityEdge display and Intel Core i7.",
    tags: ["laptop", "dell", "windows"],
    averageRating: 4.5,
    reviewCount: 289,
    totalSold: 156,
  },
  {
    name: "Logitech MX Master 3S",
    sku: "LOG-MXMASTER3S",
    brand: "Logitech",
    categoryKey: "Electronics/Computers",
    price: 99.99,
    description: "Performance wireless mouse with quiet clicks and 8K DPI tracking.",
    tags: ["mouse", "accessories", "logitech"],
    averageRating: 4.8,
    reviewCount: 1876,
    totalSold: 2200,
  },
  {
    name: "Keychron K2 Wireless Keyboard",
    sku: "KEY-K2-RGB",
    brand: "Keychron",
    categoryKey: "Electronics/Computers",
    price: 89.0,
    description: "Compact 75% layout mechanical keyboard with hot-swappable switches.",
    tags: ["keyboard", "mechanical"],
    averageRating: 4.6,
    reviewCount: 743,
    totalSold: 980,
  },
  {
    name: "Nike Air Max 90",
    sku: "NIKE-AM90",
    brand: "Nike",
    categoryKey: "Fashion/Men",
    price: 130.0,
    description: "Classic Nike silhouette with visible Max Air cushioning.",
    tags: ["sneakers", "nike", "men"],
    averageRating: 4.5,
    reviewCount: 612,
    totalSold: 890,
    variants: [
      {
        type: "Size",
        options: [
          { name: "US 9", sku: "NIKE-AM90-9", price: 130.0, stock: 20 },
          { name: "US 10", sku: "NIKE-AM90-10", price: 130.0, stock: 25 },
          { name: "US 11", sku: "NIKE-AM90-11", price: 130.0, stock: 18 },
        ],
      },
    ],
  },
  {
    name: "Levi's 501 Original Jeans",
    sku: "LEVI-501-32",
    brand: "Levi's",
    categoryKey: "Fashion/Men",
    price: 69.5,
    description: "The original button-fly jean, straight leg fit.",
    tags: ["jeans", "levis", "denim"],
    averageRating: 4.3,
    reviewCount: 891,
    totalSold: 1200,
  },
  {
    name: "Patagonia Better Sweater Fleece",
    sku: "PAT-BSW-M",
    brand: "Patagonia",
    categoryKey: "Fashion/Men",
    price: 149.0,
    description: "Warm polyester fleece jacket with low environmental impact.",
    tags: ["jacket", "fleece", "outdoor"],
    averageRating: 4.7,
    reviewCount: 456,
    totalSold: 320,
  },
  {
    name: "Adidas Ultraboost 22",
    sku: "ADID-UB22",
    brand: "Adidas",
    categoryKey: "Fashion/Women",
    price: 190.0,
    compareAtPrice: 220.0,
    description: "Responsive running shoes with Boost midsole and Primeknit upper.",
    tags: ["running", "adidas", "women"],
    averageRating: 4.6,
    reviewCount: 534,
    totalSold: 445,
  },
  {
    name: "KitchenAid Artisan Stand Mixer",
    sku: "KA-ART-5QT",
    brand: "KitchenAid",
    categoryKey: "Home/Kitchen",
    price: 449.99,
    description: "Iconic 5-quart tilt-head stand mixer with 10 speeds.",
    tags: ["kitchen", "mixer", "appliance"],
    isFeatured: true,
    averageRating: 4.9,
    reviewCount: 3201,
    totalSold: 780,
  },
  {
    name: "Dyson V15 Detect Vacuum",
    sku: "DYSON-V15",
    brand: "Dyson",
    categoryKey: "Home/Kitchen",
    price: 749.99,
    description: "Laser-detect cordless vacuum with intelligent suction adjustment.",
    tags: ["vacuum", "dyson", "home"],
    averageRating: 4.7,
    reviewCount: 876,
    totalSold: 290,
  },
  {
    name: "Nespresso Vertuo Next",
    sku: "NEST-VERTUO",
    brand: "Nespresso",
    categoryKey: "Home/Kitchen",
    price: 179.0,
    description: "Single-serve coffee maker with barcode capsule recognition.",
    tags: ["coffee", "nespresso"],
    averageRating: 4.4,
    reviewCount: 1120,
    totalSold: 650,
  },
  {
    name: "Premium Yoga Mat 6mm",
    sku: "YOGA-MAT-6MM",
    brand: "OmniFit",
    categoryKey: "Sports/Fitness",
    price: 39.99,
    description: "Non-slip eco-friendly yoga mat with alignment lines.",
    tags: ["yoga", "fitness", "mat"],
    averageRating: 4.5,
    reviewCount: 234,
    totalSold: 890,
  },
  {
    name: "Adjustable Dumbbell Set 24kg",
    sku: "FIT-DB-24",
    brand: "OmniFit",
    categoryKey: "Sports/Fitness",
    price: 299.0,
    compareAtPrice: 349.0,
    description: "Space-saving adjustable dumbbells from 2kg to 24kg per hand.",
    tags: ["dumbbells", "fitness", "strength"],
    averageRating: 4.6,
    reviewCount: 178,
    totalSold: 145,
  },
  {
    name: "Trail Hiking Backpack 40L",
    sku: "OUT-BP-40L",
    brand: "TrailPeak",
    categoryKey: "Sports/Outdoor",
    price: 89.99,
    description: "Water-resistant hiking backpack with rain cover and hydration sleeve.",
    tags: ["backpack", "hiking", "outdoor"],
    averageRating: 4.4,
    reviewCount: 312,
    totalSold: 420,
  },
  {
    name: "CeraVe Moisturizing Cream",
    sku: "CER-MC-19OZ",
    brand: "CeraVe",
    categoryKey: "Beauty/Skincare",
    price: 17.99,
    description: "Fragrance-free moisturizer with ceramides and hyaluronic acid.",
    tags: ["skincare", "moisturizer", "cerave"],
    averageRating: 4.8,
    reviewCount: 15420,
    totalSold: 8900,
  },
  {
    name: "Oral-B iO Series 9",
    sku: "ORALB-IO9",
    brand: "Oral-B",
    categoryKey: "Beauty/Personal Care",
    price: 299.99,
    compareAtPrice: 329.99,
    description: "Smart electric toothbrush with AI brushing recognition.",
    tags: ["oral-care", "electric-toothbrush"],
    averageRating: 4.6,
    reviewCount: 987,
    totalSold: 560,
  },
];

async function seedProducts(
  categories: Record<string, mongoose.Types.ObjectId>,
  vendorId: mongoose.Types.ObjectId
) {
  const products = [];

  for (const seed of PRODUCT_SEEDS) {
    const categoryId = categories[seed.categoryKey];

    if (!categoryId) {
      throw new Error(`Unknown category key: ${seed.categoryKey}`);
    }

    const slug = seed.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const product = await Product.create({
      name: seed.name,
      description: seed.description,
      sku: seed.sku,
      brand: seed.brand,
      category: categoryId,
      price: seed.price,
      compareAtPrice: seed.compareAtPrice,
      costPrice: roundMoney(seed.price * 0.6),
      variants: seed.variants ?? [],
      attributes: seed.attributes ?? [],
      images: [
        {
          url: PLACEHOLDER_IMAGE(slug),
          alt: seed.name,
          isPrimary: true,
        },
        {
          url: PLACEHOLDER_IMAGE(`${slug}-2`),
          alt: `${seed.name} alternate view`,
          isPrimary: false,
        },
      ],
      tags: seed.tags,
      averageRating: seed.averageRating ?? 0,
      reviewCount: seed.reviewCount ?? 0,
      totalSold: seed.totalSold ?? 0,
      isActive: true,
      isFeatured: seed.isFeatured ?? false,
      createdBy: vendorId,
    });

    products.push(product);
  }

  console.log(`  Created ${products.length} products`);
  return products;
}

async function seedInventory(
  products: Awaited<ReturnType<typeof seedProducts>>
) {
  const records = [];

  for (const product of products) {
    const quantity = randomInt(10, 200);
    const reservedQty = randomInt(0, Math.min(5, Math.floor(quantity * 0.1)));

    const inventory = await Inventory.create({
      product: product._id,
      warehouse: "main",
      quantity,
      reservedQty,
      reorderLevel: randomInt(10, 25),
      lastRestocked: new Date(),
    });

    records.push(inventory);
  }

  console.log(`  Created ${records.length} inventory records`);
  return records;
}

async function seedCoupons(adminId: mongoose.Types.ObjectId) {
  const now = new Date();
  const inSixMonths = new Date(now);
  inSixMonths.setMonth(inSixMonths.getMonth() + 6);

  const coupons = await Coupon.create([
    {
      code: "SAVE20",
      description: "20% off your entire order",
      discountType: "percentage",
      discountValue: 20,
      maxDiscount: 100,
      minOrderAmount: 50,
      maxUses: 500,
      maxUsesPerUser: 3,
      validFrom: now,
      validUntil: inSixMonths,
      isActive: true,
      createdBy: adminId,
    },
    {
      code: "FLAT15",
      description: "$15 off orders over $75",
      discountType: "fixed",
      discountValue: 15,
      minOrderAmount: 75,
      maxUses: 1000,
      maxUsesPerUser: 2,
      validFrom: now,
      validUntil: inSixMonths,
      isActive: true,
      createdBy: adminId,
    },
    {
      code: "FREESHIP",
      description: "Free standard shipping on any order",
      discountType: "free_shipping",
      discountValue: 0,
      minOrderAmount: 25,
      maxUses: 2000,
      maxUsesPerUser: 5,
      validFrom: now,
      validUntil: inSixMonths,
      isActive: true,
      createdBy: adminId,
    },
  ]);

  console.log(`  Created ${coupons.length} coupons`);
  return coupons;
}

function buildOrderItems(
  products: Awaited<ReturnType<typeof seedProducts>>,
  indices: number[],
  quantities: number[]
) {
  return indices.map((index, i) => {
    const product = products[index];
    const quantity = quantities[i];
    const price = product.price;

    return {
      product: product._id,
      name: product.name,
      price,
      quantity,
      image: product.images[0]?.url,
      subtotal: roundMoney(price * quantity),
    };
  });
}

function calculateOrderTotals(subtotal: number, discount = 0, freeShipping = false) {
  const tax = roundMoney(Math.max(subtotal - discount, 0) * 0.08);
  const shippingCost = freeShipping || subtotal >= 100 ? 0 : 9.99;
  const total = roundMoney(subtotal + tax + shippingCost - discount);

  return { tax, shippingCost, discount, total };
}

async function seedOrders(
  customerId: mongoose.Types.ObjectId,
  products: Awaited<ReturnType<typeof seedProducts>>
) {
  const orderDefinitions: {
    orderStatus: OrderStatus;
    paymentStatus: "pending" | "paid" | "failed" | "refunded";
    paymentMethod: "stripe" | "cod";
    items: ReturnType<typeof buildOrderItems>;
    couponCode?: string;
    discount?: number;
    tracking: { status: string; description: string; location?: string }[];
    deliveredAt?: Date;
    cancelledAt?: Date;
    cancelReason?: string;
  }[] = [
    {
      orderStatus: "pending_payment",
      paymentStatus: "pending",
      paymentMethod: "stripe",
      items: buildOrderItems(products, [0, 2], [1, 1]),
      tracking: [
        {
          status: "pending_payment",
          description: "Order placed, awaiting payment",
        },
      ],
    },
    {
      orderStatus: "processing",
      paymentStatus: "paid",
      paymentMethod: "stripe",
      items: buildOrderItems(products, [5, 7], [1, 2]),
      tracking: [
        { status: "pending_payment", description: "Order placed successfully" },
        { status: "processing", description: "Payment received, preparing order" },
      ],
    },
    {
      orderStatus: "confirmed",
      paymentStatus: "paid",
      paymentMethod: "stripe",
      items: buildOrderItems(products, [13, 14], [1, 1]),
      couponCode: "SAVE20",
      discount: 0,
      tracking: [
        { status: "pending_payment", description: "Order placed successfully" },
        { status: "processing", description: "Payment confirmed" },
        {
          status: "confirmed",
          description: "Order confirmed and queued for fulfillment",
          location: "Brooklyn Warehouse",
        },
      ],
    },
    {
      orderStatus: "shipped",
      paymentStatus: "paid",
      paymentMethod: "cod",
      items: buildOrderItems(products, [9, 11], [1, 1]),
      tracking: [
        { status: "processing", description: "Order placed successfully" },
        { status: "confirmed", description: "Items picked and packed" },
        {
          status: "shipped",
          description: "Handed off to carrier — tracking #1Z999AA10123456784",
          location: "New York, NY",
        },
      ],
    },
    {
      orderStatus: "delivered",
      paymentStatus: "paid",
      paymentMethod: "stripe",
      items: buildOrderItems(products, [19, 18], [2, 1]),
      tracking: [
        { status: "pending_payment", description: "Order placed successfully" },
        { status: "processing", description: "Payment received" },
        { status: "confirmed", description: "Order confirmed" },
        {
          status: "shipped",
          description: "Package in transit",
          location: "Regional Hub",
        },
        {
          status: "delivered",
          description: "Delivered to front door",
          location: "Brooklyn, NY",
        },
      ],
      deliveredAt: new Date(),
    },
  ];

  const orders = [];

  for (const def of orderDefinitions) {
    const subtotal = def.items.reduce((sum, item) => sum + item.subtotal, 0);
    let discount = def.discount ?? 0;

    if (def.couponCode === "SAVE20" && discount === 0) {
      discount = roundMoney(subtotal * 0.2);
    }

    const totals = calculateOrderTotals(
      subtotal,
      discount,
      def.couponCode === "FREESHIP"
    );

    const baseTime = new Date();
    baseTime.setDate(baseTime.getDate() - randomInt(1, 14));

    const trackingInfo = def.tracking.map((entry, index) => ({
      status: entry.status,
      description: entry.description,
      location: entry.location,
      timestamp: new Date(baseTime.getTime() + index * 3600000 * 6),
    }));

    const order = await Order.create({
      user: customerId,
      items: def.items,
      shippingAddress: SAMPLE_ADDRESS,
      paymentMethod: def.paymentMethod,
      paymentStatus: def.paymentStatus,
      orderStatus: def.orderStatus,
      subtotal,
      tax: totals.tax,
      shippingCost: totals.shippingCost,
      discount: totals.discount,
      total: totals.total,
      couponCode: def.couponCode,
      trackingInfo,
      deliveredAt: def.deliveredAt,
      cancelledAt: def.cancelledAt,
      cancelReason: def.cancelReason,
    });

    orders.push(order);
  }

  console.log(`  Created ${orders.length} orders`);
  return orders;
}

async function seed() {
  console.log("\nOmniChannel database seeder\n");

  await connectDatabase();
  await clearCollections();

  const users = await seedUsers();
  const [admin, vendor, customer] = users;

  const categories = await seedCategories();
  const products = await seedProducts(categories, vendor._id);
  await seedInventory(products);
  await seedCoupons(admin._id);
  await seedOrders(customer._id, products);

  console.log("\nSeed completed successfully!\n");
  console.log("  Login credentials (password for all: Password123!):");
  console.log("    admin@omnichannel.com      — superAdmin");
  console.log("    vendor@omnichannel.com     — vendorManager");
  console.log("    customer@omnichannel.com — customer\n");
}

seed()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
