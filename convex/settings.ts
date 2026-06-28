import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const setting = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
    return setting?.value ?? null;
  },
});

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("settings").collect();
    return Object.fromEntries(settings.map((s) => [s.key, s.value]));
  },
});

export const set = mutation({
  args: { key: v.string(), value: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { value: args.value, updatedAt: Date.now() });
    } else {
      await ctx.db.insert("settings", {
        key: args.key,
        value: args.value,
        updatedAt: Date.now(),
      });
    }
  },
});

export const setMultiple = mutation({
  args: { settings: v.array(v.object({ key: v.string(), value: v.string() })) },
  handler: async (ctx, args) => {
    for (const { key, value } of args.settings) {
      const existing = await ctx.db
        .query("settings")
        .withIndex("by_key", (q) => q.eq("key", key))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, { value, updatedAt: Date.now() });
      } else {
        await ctx.db.insert("settings", { key, value, updatedAt: Date.now() });
      }
    }
  },
});
