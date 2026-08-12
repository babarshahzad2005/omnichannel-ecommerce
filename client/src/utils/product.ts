import type { Product, ProductImage, ProductVariant, VariantOption } from "../types/product";

export function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function getDiscountPercent(price: number, compareAtPrice?: number): number | null {
  if (!compareAtPrice || compareAtPrice <= price) {
    return null;
  }

  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

export function getPrimaryImage(images: ProductImage[]): ProductImage | undefined {
  return images.find((image) => image.isPrimary) ?? images[0];
}

export function getProductDisplayPrice(
  product: Product,
  selectedOptions: Record<string, VariantOption | undefined>
): number {
  const variantSku = getSelectedVariantSku(product, selectedOptions);

  if (!variantSku) {
    return product.price;
  }

  for (const variant of product.variants) {
    const option = variant.options.find((entry) => entry.sku === variantSku);
    if (option) {
      return option.price;
    }
  }

  return product.price;
}

export function getSelectedVariantSku(
  product: Product,
  selectedOptions: Record<string, VariantOption | undefined>
): string | undefined {
  if (product.variants.length === 0) {
    return undefined;
  }

  const selected = product.variants
    .map((variant) => selectedOptions[variant.type])
    .filter((option): option is VariantOption => Boolean(option));

  if (selected.length !== product.variants.length) {
    return undefined;
  }

  return selected[selected.length - 1]?.sku;
}

export function initializeVariantSelection(
  variants: ProductVariant[]
): Record<string, VariantOption | undefined> {
  return variants.reduce<Record<string, VariantOption | undefined>>((acc, variant) => {
    acc[variant.type] = variant.options[0];
    return acc;
  }, {});
}

export function getCategoryName(
  category: Product["category"]
): string | undefined {
  if (typeof category === "string") {
    return undefined;
  }

  return category.name;
}
