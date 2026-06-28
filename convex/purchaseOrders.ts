import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const poItemValidator = v.object({
  variantId: v.id("productVariants"),
  productName: v.string(),
  sku: v.string(),
  quantity: v.number(),
  unitCost: v.number(),
  lineTotal: v.number(),
});

async function generatePoNumber(ctx: { db: { query: (table: string) => { collect: () => Promise<Array<{ poNumber: string }>> } } }) {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
  const prefix = `PO-${dateStr}-`;
  const all = await (ctx.db.query("purchaseOrders") as unknown as { collect: () => Promise<Array<{ poNumber: string }>> }).collect();
  const todayCount = all.filter((p) => p.poNumber.startsWith(prefix)).length;
  return `${prefix}${String(todayCount + 1).padStart(4, "0")}`;
}

export const list = query({
  args: { status: v.optional(v.string()), supplierId: v.optional(v.id("suppliers")) },
  handler: async (ctx, args) => {
    let orders = await ctx.db.query("purchaseOrders").order("desc").collect();
    if (args.status) orders = orders.filter((o) => o.status === args.status);
    if (args.supplierId) orders = orders.filter((o) => o.supplierId === args.supplierId);

    return Promise.all(
      orders.map(async (o) => {
        const supplier = await ctx.db.get(o.supplierId);
        return { ...o, supplierName: supplier?.name ?? "" };
      })
    );
  },
});

export const get = query({
  args: { id: v.id("purchaseOrders") },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.id);
    if (!order) return null;
    const supplier = await ctx.db.get(order.supplierId);
    return { ...order, supplierName: supplier?.name ?? "" };
  },
});

export const create = mutation({
  args: {
    supplierId: v.id("suppliers"),
    items: v.array(poItemValidator),
    totalAmount: v.number(),
    notes: v.optional(v.string()),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const poNumber = await generatePoNumber(ctx as unknown as Parameters<typeof generatePoNumber>[0]);
    return ctx.db.insert("purchaseOrders", {
      poNumber,
      supplierId: args.supplierId,
      items: args.items,
      totalAmount: args.totalAmount,
      status: "draft",
      notes: args.notes,
      createdBy: args.createdBy,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("purchaseOrders"),
    status: v.union(
      v.literal("draft"),
      v.literal("ordered"),
      v.literal("received"),
      v.literal("partial"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, args) => {
    const updates: Record<string, unknown> = {
      status: args.status,
      updatedAt: Date.now(),
    };
    if (args.status === "ordered") updates.orderedAt = Date.now();
    if (args.status === "received") updates.receivedAt = Date.now();
    await ctx.db.patch(args.id, updates);
  },
});

export const receiveStock = mutation({
  args: {
    id: v.id("purchaseOrders"),
    receivedItems: v.array(v.object({
      variantId: v.id("productVariants"),
      quantityReceived: v.number(),
    })),
    performedBy: v.id("users"),
    isPartial: v.boolean(),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.id);
    if (!order) throw new Error("Purchase order not found");

    for (const received of args.receivedItems) {
      if (received.quantityReceived <= 0) continue;

      const variant = await ctx.db.get(received.variantId);
      if (!variant) continue;

      const previousStock = variant.stockQuantity;
      const newStock = previousStock + received.quantityReceived;

      await ctx.db.patch(received.variantId, {
        stockQuantity: newStock,
        updatedAt: Date.now(),
      });

      await ctx.db.insert("stockMovements", {
        variantId: received.variantId,
        type: "purchase",
        quantity: received.quantityReceived,
        previousStock,
        newStock,
        referenceId: order.poNumber,
        performedBy: args.performedBy,
        createdAt: Date.now(),
      });
    }

    await ctx.db.patch(args.id, {
      status: args.isPartial ? "partial" : "received",
      receivedAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});
