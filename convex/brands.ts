import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { activeOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const q = ctx.db.query("brands").order("asc");
    const brands = await q.collect();
    if (args.activeOnly) return brands.filter((b) => b.isActive);
    return brands;
  },
});

export const get = query({
  args: { id: v.id("brands") },
  handler: async (ctx, args) => ctx.db.get(args.id),
});

export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const slug = args.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return ctx.db.insert("brands", {
      name: args.name,
      slug,
      isActive: true,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: { id: v.id("brands"), name: v.string(), isActive: v.boolean() },
  handler: async (ctx, args) => {
    const slug = args.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    await ctx.db.patch(args.id, { name: args.name, slug, isActive: args.isActive });
  },
});

export const remove = mutation({
  args: { id: v.id("brands") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
