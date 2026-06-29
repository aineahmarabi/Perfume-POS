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

export const bulkImport = mutation({
  args: {
    rows: v.array(v.object({
      name: v.string(),
      brand: v.string(),
      category: v.string(),
      description: v.optional(v.string()),
      sku: v.optional(v.string()),
      barcode: v.optional(v.string()),
      sizeMl: v.number(),
      costPrice: v.number(),
      sellingPrice: v.number(),
      stockQuantity: v.number(),
      lowStockThreshold: v.number(),
      expiryDate: v.optional(v.number()),
      isTester: v.boolean(),
    })),
  },
  handler: async (ctx, args) => {
    const toSlug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const brandMap = new Map<string, string>();
    const categoryMap = new Map<string, string>();
    const productMap = new Map<string, string>();

    for (const row of args.rows) {
      // Brand
      const brandSlug = toSlug(row.brand);
      if (!brandMap.has(brandSlug)) {
        const existing = await ctx.db.query("brands").withIndex("by_slug", (q) => q.eq("slug", brandSlug)).first();
        if (existing) {
          brandMap.set(brandSlug, existing._id);
        } else {
          const id = await ctx.db.insert("brands", { name: row.brand, slug: brandSlug, isActive: true, createdAt: Date.now() });
          brandMap.set(brandSlug, id);
        }
      }
      const brandId = brandMap.get(brandSlug)!;

      // Category
      const catSlug = toSlug(row.category);
      if (!categoryMap.has(catSlug)) {
        const existing = await ctx.db.query("categories").withIndex("by_slug", (q) => q.eq("slug", catSlug)).first();
        if (existing) {
          categoryMap.set(catSlug, existing._id);
        } else {
          const id = await ctx.db.insert("categories", { name: row.category, slug: catSlug, isActive: true, createdAt: Date.now() });
          categoryMap.set(catSlug, id);
        }
      }
      const categoryId = categoryMap.get(catSlug)!;

      // Product (match by name+brand)
      const productKey = `${row.name.toLowerCase().trim()}|${brandId}`;
      if (!productMap.has(productKey)) {
        const existing = await ctx.db.query("products").withIndex("by_brand", (q) => q.eq("brandId", brandId as never)).collect();
        const found = existing.find((p) => p.name.toLowerCase() === row.name.toLowerCase().trim());
        if (found) {
          productMap.set(productKey, found._id);
        } else {
          const id = await ctx.db.insert("products", {
            name: row.name,
            brandId: brandId as never,
            categoryId: categoryId as never,
            description: row.description,
            isActive: true,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
          productMap.set(productKey, id);
        }
      }
      const productId = productMap.get(productKey)!;

      const brandCode = row.brand.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
      const nameCode = row.name.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
      const sku = row.sku || `${brandCode}-${nameCode}-${row.sizeMl}ML`;

      await ctx.db.insert("productVariants", {
        productId: productId as never,
        sku,
        barcode: row.barcode,
        sizeMl: row.sizeMl,
        costPrice: row.costPrice,
        sellingPrice: row.sellingPrice,
        stockQuantity: row.stockQuantity,
        lowStockThreshold: row.lowStockThreshold,
        expiryDate: row.expiryDate,
        isTester: row.isTester,
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    return { imported: args.rows.length };
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
