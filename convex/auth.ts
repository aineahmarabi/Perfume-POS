import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const loginWithPin = mutation({
  args: { pin: v.string() },
  handler: async (ctx, args) => {
    const users = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("pin"), args.pin))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    if (users.length === 0) {
      return { success: false, user: null, error: "Invalid PIN" };
    }

    const user = users[0];
    return {
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
      error: null,
    };
  },
});

export const getUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;
    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      isActive: user.isActive,
    };
  },
});
