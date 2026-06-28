import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {
    activeOnly: v.optional(v.boolean()),
    brandId: v.optional(v.id("brands")),
    categoryId: v.optional(v.id("categories")),
  },
  handler: async (ctx, args) => {
    let products = await ctx.db.query("products").collect();

    if (args.activeOnly) products = products.filter((p) => p.isActive);
    if (args.brandId) products = products.filter((p) => p.brandId === args.brandId);
    if (args.categoryId) products = products.filter((p) => p.categoryId === args.categoryId);

    const enriched = await Promise.all(
      products.map(async (p) => {
        const brand = await ctx.db.get(p.brandId);
        const category = await ctx.db.get(p.categoryId);
        const variants = await ctx.db
          .query("productVariants")
          .withIndex("by_product", (q) => q.eq("productId", p._id))
          .collect();
        return {
          ...p,
          brandName: brand?.name ?? "",
          categoryName: category?.name ?? "",
          variants: variants.filter((v) => !v.isTester && v.isActive),
          variantCount: variants.filter((v) => v.isActive).length,
        };
      })
    );

    return enriched;
  },
});

export const get = query({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.id);
    if (!product) return null;
    const brand = await ctx.db.get(product.brandId);
    const category = await ctx.db.get(product.categoryId);
    const variants = await ctx.db
      .query("productVariants")
      .withIndex("by_product", (q) => q.eq("productId", args.id))
      .collect();
    return {
      ...product,
      brandName: brand?.name ?? "",
      categoryName: category?.name ?? "",
      variants,
    };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    brandId: v.id("brands"),
    categoryId: v.id("categories"),
    description: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("products", {
      ...args,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("products"),
    name: v.string(),
    brandId: v.id("brands"),
    categoryId: v.id("categories"),
    description: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;
    await ctx.db.patch(id, { ...rest, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { isActive: false, updatedAt: Date.now() });
  },
});

// Variant operations
export const createVariant = mutation({
  args: {
    productId: v.id("products"),
    sku: v.string(),
    barcode: v.optional(v.string()),
    sizeMl: v.number(),
    costPrice: v.number(),
    sellingPrice: v.number(),
    stockQuantity: v.number(),
    lowStockThreshold: v.number(),
    expiryDate: v.optional(v.number()),
    isTester: v.boolean(),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("productVariants", {
      ...args,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const updateVariant = mutation({
  args: {
    id: v.id("productVariants"),
    sku: v.string(),
    barcode: v.optional(v.string()),
    sizeMl: v.number(),
    costPrice: v.number(),
    sellingPrice: v.number(),
    stockQuantity: v.number(),
    lowStockThreshold: v.number(),
    expiryDate: v.optional(v.number()),
    isTester: v.boolean(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;
    await ctx.db.patch(id, { ...rest, updatedAt: Date.now() });
  },
});

export const deleteVariant = mutation({
  args: { id: v.id("productVariants") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { isActive: false, updatedAt: Date.now() });
  },
});

export const getVariantBySku = query({
  args: { sku: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("productVariants")
      .withIndex("by_sku", (q) => q.eq("sku", args.sku))
      .first();
  },
});

export const getVariantByBarcode = query({
  args: { barcode: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("productVariants")
      .withIndex("by_barcode", (q) => q.eq("barcode", args.barcode))
      .first();
  },
});
