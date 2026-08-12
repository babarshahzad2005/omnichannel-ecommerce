import { Types } from "mongoose";
import { getRedis } from "../config/redis";
import { getAvailableQty } from "./inventory.service";
import { Product } from "../models/product/Product";
import { ApiError } from "../utils/ApiError";

const CART_TTL_SECONDS = 7 * 24 * 60 * 60;

export interface CartItemInput {
  productId: string;
  qty: number;
  variantSku?: string;
}

export interface StoredCartItem {
  productId: string;
  qty: number;
  variantSku?: string;
}

export interface EnrichedCartItem {
  productId: string;
  name: string;
  price: number;
  image?: string;
  qty: number;
  variantSku?: string;
  subtotal: number;
}

export interface CartResponse {
  items: EnrichedCartItem[];
  cartTotal: number;
}

const getCartRedisKey = (cartKey: string): string => `cart:${cartKey}`;

const getItemFieldKey = (productId: string, variantSku?: string): string =>
  variantSku ? `${productId}:${variantSku}` : productId;

const parseStoredItem = (value: string): StoredCartItem | null => {
  try {
    return JSON.parse(value) as StoredCartItem;
  } catch {
    return null;
  }
};

const readStoredCart = async (cartKey: string): Promise<StoredCartItem[]> => {
  const redis = getRedis();
  const rawCart = await redis.hGetAll(getCartRedisKey(cartKey));

  return Object.values(rawCart)
    .map(parseStoredItem)
    .filter((item): item is StoredCartItem => item !== null);
};

const saveCartItem = async (
  cartKey: string,
  item: StoredCartItem
): Promise<void> => {
  const redis = getRedis();
  const key = getCartRedisKey(cartKey);
  const field = getItemFieldKey(item.productId, item.variantSku);

  await redis
    .multi()
    .hSet(key, field, JSON.stringify(item))
    .expire(key, CART_TTL_SECONDS)
    .exec();
};

const removeCartItem = async (
  cartKey: string,
  productId: string,
  variantSku?: string
): Promise<void> => {
  const redis = getRedis();
  const key = getCartRedisKey(cartKey);
  const field = getItemFieldKey(productId, variantSku);

  await redis
    .multi()
    .hDel(key, field)
    .expire(key, CART_TTL_SECONDS)
    .exec();
};

const getVariantPrice = (
  product: {
    price: number;
    variants: Array<{
      options: Array<{ sku: string; price: number }>;
    }>;
  },
  variantSku?: string
): number => {
  if (!variantSku) {
    return product.price;
  }

  for (const variant of product.variants) {
    const option = variant.options.find((entry) => entry.sku === variantSku);

    if (option) {
      return option.price;
    }
  }

  throw new ApiError(400, `Variant SKU not found: ${variantSku}`);
};

const validateProductAndStock = async (
  productId: string,
  qty: number,
  variantSku?: string
): Promise<void> => {
  if (!Types.ObjectId.isValid(productId)) {
    throw new ApiError(400, "Invalid product ID");
  }

  if (qty <= 0) {
    throw new ApiError(400, "Quantity must be greater than 0");
  }

  const product = await Product.findOne({ _id: productId, isActive: true });

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  if (variantSku) {
    getVariantPrice(product, variantSku);
  }

  const availableQty = await getAvailableQty(productId);

  if (availableQty < qty) {
    throw new ApiError(409, "Insufficient stock available");
  }
};

const enrichCartItems = async (
  items: StoredCartItem[]
): Promise<CartResponse> => {
  if (!items.length) {
    return { items: [], cartTotal: 0 };
  }

  const productIds = [...new Set(items.map((item) => item.productId))];
  const products = await Product.find({
    _id: { $in: productIds },
    isActive: true,
  }).select("name price images variants");

  const productMap = new Map(
    products.map((product) => [product._id.toString(), product])
  );

  const enrichedItems: EnrichedCartItem[] = [];
  let cartTotal = 0;

  for (const item of items) {
    const product = productMap.get(item.productId);

    if (!product) {
      continue;
    }

    const price = getVariantPrice(product, item.variantSku);
    const primaryImage =
      product.images.find((image) => image.isPrimary) ?? product.images[0];
    const subtotal = price * item.qty;

    enrichedItems.push({
      productId: item.productId,
      name: product.name,
      price,
      image: primaryImage?.url,
      qty: item.qty,
      variantSku: item.variantSku,
      subtotal,
    });

    cartTotal += subtotal;
  }

  return {
    items: enrichedItems,
    cartTotal,
  };
};

export const getCart = async (cartKey: string): Promise<CartResponse> => {
  const items = await readStoredCart(cartKey);
  return enrichCartItems(items);
};

export const addToCart = async (
  cartKey: string,
  input: CartItemInput
): Promise<CartResponse> => {
  const storedItems = await readStoredCart(cartKey);
  const field = getItemFieldKey(input.productId, input.variantSku);
  const existingItem = storedItems.find(
    (item) => getItemFieldKey(item.productId, item.variantSku) === field
  );

  const newQty = (existingItem?.qty ?? 0) + input.qty;

  await validateProductAndStock(input.productId, newQty, input.variantSku);

  await saveCartItem(cartKey, {
    productId: input.productId,
    qty: newQty,
    variantSku: input.variantSku,
  });

  return getCart(cartKey);
};

export const updateCartItem = async (
  cartKey: string,
  productId: string,
  qty: number,
  variantSku?: string
): Promise<CartResponse> => {
  if (!Types.ObjectId.isValid(productId)) {
    throw new ApiError(400, "Invalid product ID");
  }

  if (qty === 0) {
    await removeCartItem(cartKey, productId, variantSku);
    return getCart(cartKey);
  }

  if (qty < 0) {
    throw new ApiError(400, "Quantity cannot be negative");
  }

  await validateProductAndStock(productId, qty, variantSku);

  await saveCartItem(cartKey, {
    productId,
    qty,
    variantSku,
  });

  return getCart(cartKey);
};

export const clearCart = async (cartKey: string): Promise<void> => {
  const redis = getRedis();
  await redis.del(getCartRedisKey(cartKey));
};

export const getCartTotal = async (cartKey: string): Promise<number> => {
  const cart = await getCart(cartKey);
  return cart.cartTotal;
};

export const mergeCart = async (
  guestSessionId: string,
  userId: string
): Promise<CartResponse> => {
  const guestItems = await readStoredCart(guestSessionId);

  if (!guestItems.length) {
    return getCart(userId);
  }

  const userItems = await readStoredCart(userId);
  const mergedMap = new Map<string, StoredCartItem>();

  for (const item of userItems) {
    mergedMap.set(getItemFieldKey(item.productId, item.variantSku), { ...item });
  }

  for (const guestItem of guestItems) {
    const field = getItemFieldKey(guestItem.productId, guestItem.variantSku);
    const existing = mergedMap.get(field);
    const mergedQty = (existing?.qty ?? 0) + guestItem.qty;

    await validateProductAndStock(
      guestItem.productId,
      mergedQty,
      guestItem.variantSku
    );

    mergedMap.set(field, {
      productId: guestItem.productId,
      qty: mergedQty,
      variantSku: guestItem.variantSku,
    });
  }

  const redis = getRedis();
  const userCartKey = getCartRedisKey(userId);

  await redis.del(userCartKey);

  if (mergedMap.size > 0) {
    const entries = [...mergedMap.values()].map((item) => ({
      field: getItemFieldKey(item.productId, item.variantSku),
      value: JSON.stringify(item),
    }));

    const multi = redis.multi();

    for (const entry of entries) {
      multi.hSet(userCartKey, entry.field, entry.value);
    }

    multi.expire(userCartKey, CART_TTL_SECONDS);
    await multi.exec();
  }

  await clearCart(guestSessionId);

  return getCart(userId);
};
