# OmniChannel UI Reference Set

These mockups are visual references for the OmniChannel omnichannel e-commerce and inventory platform described in `OmniChannel_ECommerce_Development_Plan.pdf`. They are intentionally organized by user role and workflow so they can be used alongside the planned React routes and protected role-based areas.

## Screen map

| File | Primary route concept | Role | Feature coverage |
|---|---|---|---|
| `01-customer-storefront-catalog.png` | `/products` | Public / Customer | Full-text search, faceted filters, category browsing, stock status, product cards, vendor display, cart preview |
| `02-customer-product-detail.png` | `/products/:id` | Public / Customer | Product images, variants, pricing, vendor information, inventory state, specifications, reviews |
| `03-customer-cart-checkout.png` | `/checkout` | Customer | Shipping address, delivery method, Stripe/PayPal selection, coupon validation, price breakdown, stock-reservation timer |
| `04-customer-order-tracking.png` | `/orders/:id` | Customer | Order status state machine, live updates, shipment tracking, delivery map, invoice download |
| `05-vendor-product-management.png` | `/vendor/products` | Vendor Manager | Vendor-scoped product CRUD, variants, product status, low-stock visibility, product edit drawer |
| `06-warehouse-fulfillment-inventory.png` | `/warehouse/fulfillment` | Warehouse Staff | Fulfillment queue, pick list, bin locations, inventory synchronization, low-stock alerts, status updates |
| `07-admin-sales-analytics.png` | `/admin/analytics` | Super Admin | Revenue, orders, average order value, conversion rate, trend charts, category mix, vendor performance, activity feed |
| `08-admin-reviews-coupons.png` | `/admin/reviews` and `/admin/coupons` | Super Admin | Review moderation, approval workflow, verified purchase indicator, promotions, coupon types and status |

## Shared visual direction

Use a light enterprise-commerce interface with a warm off-white canvas, white content cards, dark ink-navy text, cobalt blue for primary actions and active states, mint green for successful or live states, and amber for low-stock or attention states. Use thin neutral borders, medium corner radii, generous spacing, accessible contrast, and a consistent 8px spacing rhythm. Customer pages use the full storefront header; vendor, warehouse, and admin pages use a persistent dark-navy sidebar with role-specific navigation.

## Implementation priorities

The customer journey should be implemented first as a connected flow: catalog → product detail → checkout → order tracking. The operational areas should then be protected by role: Vendor Manager for products and vendor orders, Warehouse Staff for fulfillment and inventory, and Super Admin for analytics, moderation, coupons, users, and audit activity. Preserve the status labels shown in the mockups because they correspond to the planned order state machine: `pending_payment`, `processing`, `confirmed`, `shipped`, `delivered`, and `cancelled`.

The mockups are conceptual visual references rather than pixel-perfect specifications. Treat them as guidance for layout hierarchy, component grouping, interaction affordances, information density, and visual states. Use real backend data and validation rules from the development plan when implementing them.
