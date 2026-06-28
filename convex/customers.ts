import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query("customers").order("desc").collect();
  },
});

export const get = query({
  args: { id: v.id("customers") },
  handler: async (ctx, args) => ctx.db.get(args.id),
});

export const searchByPhone = query({
  args: { phone: v.string() },
  handler: async (ctx, args) => {
    if (!args.phone || args.phone.length < 3) return [];
    const customers = await ctx.db.query("customers").collect();
    return customers.filter((c) => c.phone.includes(args.phone));
  },
});

export const searchByName = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    if (!args.name || args.name.length < 2) return [];
    const customers = await ctx.db.query("customers").collect();
    return customers.filter((c) =>
      c.name.toLowerCase().includes(args.name.toLowerCase())
    );
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("customers")
      .withIndex("by_phone", (q) => q.eq("phone", args.phone))
      .first();
    if (existing) throw new Error("Customer with this phone already exists");

    return ctx.db.insert("customers", {
      ...args,
      loyaltyPoints: 0,
      totalSpent: 0,
      visitCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("customers"),
    name: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;
    await ctx.db.patch(id, { ...rest, updatedAt: Date.now() });
  },
});

export const getCustomerSales = query({
  args: { customerId: v.id("customers") },
  handler: async (ctx, args) => {
    return ctx.db
      .query("sales")
      .withIndex("by_customer", (q) => q.eq("customerId", args.customerId))
      .order("desc")
      .take(50);
  },
});
