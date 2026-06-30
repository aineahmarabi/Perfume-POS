import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ─── USERS / STAFF ───
  users: defineTable({
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    role: v.union(v.literal("admin"), v.literal("cashier")),
    pin: v.string(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_role", ["role"]),

  // ─── BRANDS ───
  brands: defineTable({
    name: v.string(),
    slug: v.string(),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_slug", ["slug"]),

  // ─── CATEGORIES ───
  categories: defineTable({
    name: v.string(),
    slug: v.string(),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_slug", ["slug"]),

  // ─── PRODUCTS ───
  products: defineTable({
    name: v.string(),
    brandId: v.id("brands"),
    categoryId: v.id("categories"),
    description: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_brand", ["brandId"])
    .index("by_category", ["categoryId"])
    .index("by_active", ["isActive"]),

  // ─── PRODUCT VARIANTS ───
  productVariants: defineTable({
    productId: v.id("products"),
    sku: v.string(),
    barcode: v.optional(v.string()),
    sizeMl: v.number(),
    costPrice: v.number(),
    sellingPrice: v.number(),
    stockQuantity: v.number(),
    lowStockThreshold: v.number(),
    expiryDate: v.optional(v.number()),
    isTester: v.boolean(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_product", ["productId"])
    .index("by_sku", ["sku"])
    .index("by_barcode", ["barcode"])
    .index("by_low_stock", ["stockQuantity"]),

  // ─── CUSTOMERS ───
  customers: defineTable({
    name: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    loyaltyPoints: v.number(),
    totalSpent: v.number(),
    visitCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_phone", ["phone"]),

  // ─── SALES ───
  sales: defineTable({
    saleNumber: v.string(),
    cashierId: v.id("users"),
    customerId: v.optional(v.id("customers")),
    items: v.array(v.object({
      variantId: v.id("productVariants"),
      productName: v.string(),
      brandName: v.string(),
      sizeMl: v.number(),
      sku: v.string(),
      quantity: v.number(),
      unitPrice: v.number(),
      discount: v.number(),
      lineTotal: v.number(),
    })),
    subtotal: v.number(),
    discountTotal: v.number(),
    taxRate: v.number(),
    taxAmount: v.number(),
    grandTotal: v.number(),
    paymentMethod: v.union(
      v.literal("cash"),
      v.literal("mpesa"),
      v.literal("card"),
      v.literal("split")
    ),
    paymentDetails: v.object({
      cashAmount: v.optional(v.number()),
      cashChange: v.optional(v.number()),
      mpesaAmount: v.optional(v.number()),
      mpesaRef: v.optional(v.string()),
      cardAmount: v.optional(v.number()),
      cardRef: v.optional(v.string()),
      cardLast4: v.optional(v.string()),
    }),
    status: v.union(
      v.literal("completed"),
      v.literal("voided"),
      v.literal("refunded"),
      v.literal("on_hold")
    ),
    notes: v.optional(v.string()),
    voidReason: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_sale_number", ["saleNumber"])
    .index("by_cashier", ["cashierId"])
    .index("by_customer", ["customerId"])
    .index("by_status", ["status"])
    .index("by_date", ["createdAt"])
    .index("by_payment_method", ["paymentMethod"]),

  // ─── STOCK MOVEMENTS ───
  stockMovements: defineTable({
    variantId: v.id("productVariants"),
    type: v.union(
      v.literal("purchase"),
      v.literal("sale"),
      v.literal("adjustment"),
      v.literal("return"),
      v.literal("damage"),
      v.literal("transfer")
    ),
    quantity: v.number(),
    previousStock: v.number(),
    newStock: v.number(),
    referenceId: v.optional(v.string()),
    reason: v.optional(v.string()),
    performedBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_variant", ["variantId"])
    .index("by_type", ["type"])
    .index("by_date", ["createdAt"]),

  // ─── SUPPLIERS ───
  suppliers: defineTable({
    name: v.string(),
    contactName: v.optional(v.string()),
    phone: v.string(),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
  }),

  // ─── PURCHASE ORDERS ───
  purchaseOrders: defineTable({
    poNumber: v.string(),
    supplierId: v.id("suppliers"),
    items: v.array(v.object({
      variantId: v.id("productVariants"),
      productName: v.string(),
      sku: v.string(),
      quantity: v.number(),
      unitCost: v.number(),
      lineTotal: v.number(),
    })),
    totalAmount: v.number(),
    status: v.union(
      v.literal("draft"),
      v.literal("ordered"),
      v.literal("received"),
      v.literal("partial"),
      v.literal("cancelled")
    ),
    notes: v.optional(v.string()),
    orderedAt: v.optional(v.number()),
    receivedAt: v.optional(v.number()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_po_number", ["poNumber"])
    .index("by_supplier", ["supplierId"])
    .index("by_status", ["status"]),

  // ─── EXPENSES ───
  expenses: defineTable({
    description: v.string(),
    category: v.union(
      v.literal("rent"),
      v.literal("utilities"),
      v.literal("salaries"),
      v.literal("supplies"),
      v.literal("marketing"),
      v.literal("maintenance"),
      v.literal("other")
    ),
    amount: v.number(),
    date: v.number(),
    receiptUrl: v.optional(v.string()),
    recordedBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_category", ["category"])
    .index("by_date", ["date"]),

  // ─── LOGIN ATTEMPTS (brute-force protection) ───
  loginAttempts: defineTable({
    timestamp: v.number(),
    success: v.boolean(),
  })
    .index("by_timestamp", ["timestamp"]),

  // ─── SETTINGS ───
  settings: defineTable({
    key: v.string(),
    value: v.string(),
    updatedAt: v.number(),
  })
    .index("by_key", ["key"]),

  // ─── PENDING MPESA PAYMENTS ───
  mpesaPayments: defineTable({
    saleReference: v.string(),
    phone: v.string(),
    amount: v.number(),
    checkoutRequestId: v.optional(v.string()),
    merchantRequestId: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    mpesaReceiptNumber: v.optional(v.string()),
    resultCode: v.optional(v.number()),
    resultDesc: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_checkout_request", ["checkoutRequestId"])
    .index("by_sale_ref", ["saleReference"]),
});
