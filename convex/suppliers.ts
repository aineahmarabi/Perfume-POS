import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { activeOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const suppliers = await ctx.db.query("suppliers").order("asc").collect();
    if (args.activeOnly) return suppliers.filter((s) => s.isActive);
    return suppliers;
  },
});

export const get = query({
  args: { id: v.id("suppliers") },
  handler: async (ctx, args) => ctx.db.get(args.id),
});

export const create = mutation({
  args: {
    name: v.string(),
    contactName: v.optional(v.string()),
    phone: v.string(),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("suppliers", {
      ...args,
      isActive: true,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("suppliers"),
    name: v.string(),
    contactName: v.optional(v.string()),
    phone: v.string(),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;
    await ctx.db.patch(id, rest);
  },
});

export const remove = mutation({
  args: { id: v.id("suppliers") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { isActive: false });
  },
});
