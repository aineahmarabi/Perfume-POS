import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { activeOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const categories = await ctx.db.query("categories").order("asc").collect();
    if (args.activeOnly) return categories.filter((c) => c.isActive);
    return categories;
  },
});

export const get = query({
  args: { id: v.id("categories") },
  handler: async (ctx, args) => ctx.db.get(args.id),
});

export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const slug = args.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return ctx.db.insert("categories", {
      name: args.name,
      slug,
      isActive: true,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: { id: v.id("categories"), name: v.string(), isActive: v.boolean() },
  handler: async (ctx, args) => {
    const slug = args.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    await ctx.db.patch(args.id, { name: args.name, slug, isActive: args.isActive });
  },
});

export const remove = mutation({
  args: { id: v.id("categories") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
