import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const categoryValidator = v.union(
  v.literal("rent"),
  v.literal("utilities"),
  v.literal("salaries"),
  v.literal("supplies"),
  v.literal("marketing"),
  v.literal("maintenance"),
  v.literal("other")
);

export const list = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let expenses = await ctx.db.query("expenses").order("desc").collect();
    if (args.startDate) expenses = expenses.filter((e) => e.date >= args.startDate!);
    if (args.endDate) expenses = expenses.filter((e) => e.date <= args.endDate!);
    if (args.category) expenses = expenses.filter((e) => e.category === args.category);
    return expenses;
  },
});

export const create = mutation({
  args: {
    description: v.string(),
    category: categoryValidator,
    amount: v.number(),
    date: v.number(),
    receiptUrl: v.optional(v.string()),
    recordedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("expenses", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("expenses"),
    description: v.string(),
    category: categoryValidator,
    amount: v.number(),
    date: v.number(),
  },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;
    await ctx.db.patch(id, rest);
  },
});

export const remove = mutation({
  args: { id: v.id("expenses") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
