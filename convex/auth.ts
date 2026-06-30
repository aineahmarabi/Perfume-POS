import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const WINDOW_MS = 15 * 60 * 1000;   // 15-minute rolling window
const MAX_FAILURES = 10;             // failures before lockout
const LOCKOUT_MS = 30 * 60 * 1000;  // 30-minute lockout
const WARN_AFTER = 5;                // show warning after this many failures
const CLEANUP_OLDER_THAN = 24 * 60 * 60 * 1000; // purge records older than 24 h

export const loginWithPin = mutation({
  args: { pin: v.string() },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Purge records older than 24 h to keep the table lean
    const cutoff = now - CLEANUP_OLDER_THAN;
    const old = await ctx.db
      .query("loginAttempts")
      .withIndex("by_timestamp", (q) => q.lt("timestamp", cutoff))
      .collect();
    for (const r of old) await ctx.db.delete(r._id);

    // Count recent failures within the rolling window
    const windowStart = now - WINDOW_MS;
    const recentFailures = await ctx.db
      .query("loginAttempts")
      .withIndex("by_timestamp", (q) => q.gt("timestamp", windowStart))
      .filter((q) => q.eq(q.field("success"), false))
      .collect();

    // Check if currently locked out
    if (recentFailures.length >= MAX_FAILURES) {
      const sorted = [...recentFailures].sort((a, b) => a.timestamp - b.timestamp);
      const lockStart = sorted[sorted.length - MAX_FAILURES].timestamp;
      const lockedUntil = lockStart + LOCKOUT_MS;
      if (now < lockedUntil) {
        return {
          success: false,
          user: null,
          error: "locked",
          lockedUntil,
          attemptsLeft: 0,
        };
      }
    }

    // Attempt the login
    const users = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("pin"), args.pin))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const success = users.length > 0;

    // Record this attempt
    await ctx.db.insert("loginAttempts", { timestamp: now, success });

    if (!success) {
      // Recount after recording so the number is accurate
      const updatedFailures = recentFailures.length + 1;
      const attemptsLeft = Math.max(0, MAX_FAILURES - updatedFailures);
      return {
        success: false,
        user: null,
        error: "invalid",
        attemptsLeft: updatedFailures >= WARN_AFTER ? attemptsLeft : null,
        lockedUntil: null,
      };
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
      attemptsLeft: null,
      lockedUntil: null,
    };
  },
});

export const clearLoginAttempts = mutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("loginAttempts").collect();
    for (const r of all) await ctx.db.delete(r._id);
    return { cleared: all.length };
  },
});

export const getLoginAttemptStats = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const windowStart = now - WINDOW_MS;
    const recent = await ctx.db
      .query("loginAttempts")
      .withIndex("by_timestamp", (q) => q.gt("timestamp", windowStart))
      .collect();
    const failures = recent.filter((r) => !r.success).length;
    const successes = recent.filter((r) => r.success).length;

    let lockedUntil: number | null = null;
    if (failures >= MAX_FAILURES) {
      const sorted = [...recent.filter((r) => !r.success)].sort((a, b) => a.timestamp - b.timestamp);
      const lockStart = sorted[sorted.length - MAX_FAILURES].timestamp;
      const candidate = lockStart + LOCKOUT_MS;
      if (now < candidate) lockedUntil = candidate;
    }

    return { failures, successes, lockedUntil, maxFailures: MAX_FAILURES, windowMinutes: 15, lockoutMinutes: 30 };
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
