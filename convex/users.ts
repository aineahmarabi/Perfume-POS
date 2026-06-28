import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users.map((u) => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      isActive: u.isActive,
      createdAt: u.createdAt,
    }));
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    role: v.union(v.literal("admin"), v.literal("cashier")),
    pin: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    if (existing) throw new Error("User with this email already exists");

    return ctx.db.insert("users", {
      ...args,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("users"),
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    role: v.union(v.literal("admin"), v.literal("cashier")),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;
    await ctx.db.patch(id, { ...rest, updatedAt: Date.now() });
  },
});

export const resetPin = mutation({
  args: { id: v.id("users"), newPin: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { pin: args.newPin, updatedAt: Date.now() });
  },
});

export const toggleActive = mutation({
  args: { id: v.id("users"), isActive: v.boolean(), requestedBy: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    if (args.requestedBy && args.requestedBy === args.id) {
      throw new Error("You cannot deactivate your own account");
    }
    await ctx.db.patch(args.id, { isActive: args.isActive, updatedAt: Date.now() });
  },
});
