import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const saleItemValidator = v.object({
  variantId: v.id("productVariants"),
  productName: v.string(),
  brandName: v.string(),
  sizeMl: v.number(),
  sku: v.string(),
  quantity: v.number(),
  unitPrice: v.number(),
  discount: v.number(),
  lineTotal: v.number(),
});

const paymentDetailsValidator = v.object({
  cashAmount: v.optional(v.number()),
  cashChange: v.optional(v.number()),
  mpesaAmount: v.optional(v.number()),
  mpesaRef: v.optional(v.string()),
  cardAmount: v.optional(v.number()),
  cardRef: v.optional(v.string()),
  cardLast4: v.optional(v.string()),
});

async function generateSaleNumber(ctx: { db: { query: (table: string) => { withIndex: (name: string, fn: (q: { eq: (field: string, value: string) => object }) => object) => { collect: () => Promise<Array<{ saleNumber: string }>> } } } }) {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
  const prefix = `SAL-${dateStr}-`;

  const todaySales = await (ctx.db.query("sales") as unknown as { collect: () => Promise<Array<{ saleNumber: string; createdAt: number }>> }).collect();
  const todayCount = todaySales.filter(
    (s) => s.saleNumber.startsWith(prefix)
  ).length;

  return `${prefix}${String(todayCount + 1).padStart(4, "0")}`;
}

export const create = mutation({
  args: {
    cashierId: v.id("users"),
    customerId: v.optional(v.id("customers")),
    items: v.array(saleItemValidator),
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
    paymentDetails: paymentDetailsValidator,
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate stock and decrement atomically
    for (const item of args.items) {
      const variant = await ctx.db.get(item.variantId);
      if (!variant) throw new Error(`Variant ${item.variantId} not found`);
      if (variant.stockQuantity < item.quantity) {
        throw new Error(`Insufficient stock for ${item.productName} ${item.sizeMl}ml`);
      }
    }

    const saleNumber = await generateSaleNumber(ctx as unknown as Parameters<typeof generateSaleNumber>[0]);

    // Decrement stock and create movements
    for (const item of args.items) {
      const variant = await ctx.db.get(item.variantId);
      if (!variant) continue;
      const previousStock = variant.stockQuantity;
      const newStock = previousStock - item.quantity;

      await ctx.db.patch(item.variantId, {
        stockQuantity: newStock,
        updatedAt: Date.now(),
      });

      await ctx.db.insert("stockMovements", {
        variantId: item.variantId,
        type: "sale",
        quantity: -item.quantity,
        previousStock,
        newStock,
        referenceId: saleNumber,
        performedBy: args.cashierId,
        createdAt: Date.now(),
      });
    }

    // Update customer stats if attached
    if (args.customerId) {
      const customer = await ctx.db.get(args.customerId);
      if (customer) {
        const loyaltyEarned = Math.floor(args.grandTotal / 100);
        await ctx.db.patch(args.customerId, {
          totalSpent: customer.totalSpent + args.grandTotal,
          visitCount: customer.visitCount + 1,
          loyaltyPoints: customer.loyaltyPoints + loyaltyEarned,
          updatedAt: Date.now(),
        });
      }
    }

    const saleId = await ctx.db.insert("sales", {
      saleNumber,
      cashierId: args.cashierId,
      customerId: args.customerId,
      items: args.items,
      subtotal: args.subtotal,
      discountTotal: args.discountTotal,
      taxRate: args.taxRate,
      taxAmount: args.taxAmount,
      grandTotal: args.grandTotal,
      paymentMethod: args.paymentMethod,
      paymentDetails: args.paymentDetails,
      status: "completed",
      notes: args.notes,
      createdAt: Date.now(),
    });

    return { saleId, saleNumber };
  },
});

export const holdSale = mutation({
  args: {
    cashierId: v.id("users"),
    customerId: v.optional(v.id("customers")),
    items: v.array(saleItemValidator),
    subtotal: v.number(),
    discountTotal: v.number(),
    taxRate: v.number(),
    taxAmount: v.number(),
    grandTotal: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
    const allSales = await ctx.db.query("sales").collect();
    const holdCount = allSales.filter(
      (s) => s.saleNumber.startsWith(`HLD-${dateStr}`)
    ).length;
    const saleNumber = `HLD-${dateStr}-${String(holdCount + 1).padStart(4, "0")}`;

    return ctx.db.insert("sales", {
      saleNumber,
      cashierId: args.cashierId,
      customerId: args.customerId,
      items: args.items,
      subtotal: args.subtotal,
      discountTotal: args.discountTotal,
      taxRate: args.taxRate,
      taxAmount: args.taxAmount,
      grandTotal: args.grandTotal,
      paymentMethod: "cash",
      paymentDetails: {},
      status: "on_hold",
      notes: args.notes,
      createdAt: Date.now(),
    });
  },
});

export const getHeldSales = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db
      .query("sales")
      .withIndex("by_status", (q) => q.eq("status", "on_hold"))
      .order("desc")
      .collect();
  },
});

export const releaseHold = mutation({
  args: { saleId: v.id("sales") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.saleId);
  },
});

export const voidSale = mutation({
  args: {
    saleId: v.id("sales"),
    voidReason: v.string(),
    performedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const sale = await ctx.db.get(args.saleId);
    if (!sale) throw new Error("Sale not found");
    if (sale.status !== "completed") throw new Error("Only completed sales can be voided");

    // Restore stock
    for (const item of sale.items) {
      const variant = await ctx.db.get(item.variantId);
      if (!variant) continue;
      const previousStock = variant.stockQuantity;
      const newStock = previousStock + item.quantity;

      await ctx.db.patch(item.variantId, {
        stockQuantity: newStock,
        updatedAt: Date.now(),
      });

      await ctx.db.insert("stockMovements", {
        variantId: item.variantId,
        type: "return",
        quantity: item.quantity,
        previousStock,
        newStock,
        referenceId: sale.saleNumber,
        reason: `Void: ${args.voidReason}`,
        performedBy: args.performedBy,
        createdAt: Date.now(),
      });
    }

    // Reverse customer stats
    if (sale.customerId) {
      const customer = await ctx.db.get(sale.customerId);
      if (customer) {
        const loyaltyToRemove = Math.floor(sale.grandTotal / 100);
        await ctx.db.patch(sale.customerId, {
          totalSpent: Math.max(0, customer.totalSpent - sale.grandTotal),
          visitCount: Math.max(0, customer.visitCount - 1),
          loyaltyPoints: Math.max(0, customer.loyaltyPoints - loyaltyToRemove),
          updatedAt: Date.now(),
        });
      }
    }

    await ctx.db.patch(args.saleId, {
      status: "voided",
      voidReason: args.voidReason,
    });
  },
});

export const list = query({
  args: {
    cashierId: v.optional(v.id("users")),
    status: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    paymentMethod: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let sales = await ctx.db
      .query("sales")
      .withIndex("by_date")
      .order("desc")
      .collect();

    if (args.cashierId) sales = sales.filter((s) => s.cashierId === args.cashierId);
    if (args.status) sales = sales.filter((s) => s.status === args.status);
    if (args.startDate) sales = sales.filter((s) => s.createdAt >= args.startDate!);
    if (args.endDate) sales = sales.filter((s) => s.createdAt <= args.endDate!);
    if (args.paymentMethod) sales = sales.filter((s) => s.paymentMethod === args.paymentMethod);

    const limit = args.limit ?? 200;
    return sales.slice(0, limit);
  },
});

export const get = query({
  args: { id: v.id("sales") },
  handler: async (ctx, args) => {
    const sale = await ctx.db.get(args.id);
    if (!sale) return null;

    const cashier = await ctx.db.get(sale.cashierId);
    const customer = sale.customerId ? await ctx.db.get(sale.customerId) : null;

    return {
      ...sale,
      cashierName: cashier?.name ?? "",
      customerName: customer?.name ?? "Walk-in",
      customerPhone: customer?.phone ?? "",
    };
  },
});

export const deleteSale = mutation({
  args: { saleId: v.id("sales") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.saleId);
  },
});

export const getTodaySales = query({
  args: {},
  handler: async (ctx) => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    return ctx.db
      .query("sales")
      .withIndex("by_date")
      .filter((q) => q.gte(q.field("createdAt"), startOfDay.getTime()))
      .collect();
  },
});
