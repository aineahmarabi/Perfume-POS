import { mutation } from "./_generated/server";

const CATALOGUE = [
  { name: "Yara Moi EDP", brand: "Lattafa", sizeMl: 100, sellingPrice: 2500 },
  { name: "Tharwah Gold Natural Spray EDP", brand: "Lattafa", sizeMl: 100, sellingPrice: 3500 },
  { name: "John Gustav Homme Classic EDP", brand: "Fragrance World", sizeMl: 100, sellingPrice: 2000 },
  { name: "Now Women EDP", brand: "Lattafa", sizeMl: 100, sellingPrice: 2500 },
  { name: "Asad Zanzibar", brand: "Lattafa", sizeMl: 100, sellingPrice: 2900 },
  { name: "Night Club Silky EDP", brand: "French Avenue", sizeMl: 100, sellingPrice: 2600 },
  { name: "Ebony Fume", brand: "Fragrance World", sizeMl: 80, sellingPrice: 1800 },
  { name: "Tuscany Leather EDP", brand: "Fragrance World", sizeMl: 80, sellingPrice: 1800 },
  { name: "Delilah Pour Femme EDP", brand: "Maison Alhambra", sizeMl: 100, sellingPrice: 3000 },
  { name: "Proud of You Leather EDP", brand: "Fragrance World", sizeMl: 100, sellingPrice: 2000 },
  { name: "Ana Abiyedh Rouge EDP", brand: "Lattafa", sizeMl: 60, sellingPrice: 2100 },
  { name: "Heibah", brand: "Ard Al Zaafaran", sizeMl: 100, sellingPrice: 2100 },
  { name: "Cocktail Intense", brand: "Fragrance World", sizeMl: 100, sellingPrice: 2000 },
  { name: "Vulcan Feu", brand: "French Avenue", sizeMl: 100, sellingPrice: 3800 },
  { name: "Cocoa Morado EDP", brand: "Fragrance World", sizeMl: 100, sellingPrice: 3900 },
  { name: "Proud of You Tobacco", brand: "French Avenue", sizeMl: 100, sellingPrice: 2000 },
  { name: "Khamrah Qahwa EDP", brand: "Lattafa", sizeMl: 100, sellingPrice: 3800 },
  { name: "Imperium EDP", brand: "Fragrance World", sizeMl: 100, sellingPrice: 2100 },
  { name: "Yara Candy", brand: "Lattafa", sizeMl: 100, sellingPrice: 3000 },
  { name: "Bade'e Al Oud Amethyst EDP", brand: "Lattafa", sizeMl: 100, sellingPrice: 3000 },
  { name: "Teriaq Intense", brand: "Lattafa", sizeMl: 100, sellingPrice: 4000 },
  { name: "Just Wardi EDP", brand: "Lattafa", sizeMl: 100, sellingPrice: 2000 },
  { name: "Nebras Natural Spray EDP", brand: "Lattafa", sizeMl: 100, sellingPrice: 3900 },
  { name: "Sweet Paradise EDP", brand: "French Avenue", sizeMl: 100, sellingPrice: 4000 },
  { name: "Asad EDP", brand: "Lattafa", sizeMl: 100, sellingPrice: 2900 },
  { name: "Ramz Silver", brand: "Lattafa", sizeMl: 100, sellingPrice: 2000 },
  { name: "Atheeri EDP", brand: "Lattafa", sizeMl: 100, sellingPrice: 3700 },
  { name: "Khamrah", brand: "Lattafa", sizeMl: 100, sellingPrice: 3800 },
  { name: "Azzure Oud", brand: "Fragrance World", sizeMl: 100, sellingPrice: 3900 },
  { name: "Eclair Affair", brand: "French Avenue", sizeMl: 100, sellingPrice: 3400 },
  { name: "Shmallow Fluff EDP", brand: "French Avenue", sizeMl: 100, sellingPrice: 3700 },
  { name: "Mashrabya", brand: "Lattafa", sizeMl: 100, sellingPrice: 3000 },
  { name: "Khamrah Dukhan EDP", brand: "Lattafa", sizeMl: 100, sellingPrice: 3800 },
  { name: "Yara EDP Spray", brand: "Lattafa", sizeMl: 50, sellingPrice: 750 },
  { name: "Yara For Women EDP", brand: "Lattafa", sizeMl: 100, sellingPrice: 2600 },
  { name: "Liquid Brun EDP", brand: "Other", sizeMl: 100, sellingPrice: 3800 },
  { name: "Angam", brand: "Other", sizeMl: 100, sellingPrice: 3500 },
  { name: "Angam Second Song", brand: "Other", sizeMl: 100, sellingPrice: 3500 },
  { name: "Alqiam", brand: "Lattafa", sizeMl: 100, sellingPrice: 3000 },
  { name: "Lushcherry", brand: "Other", sizeMl: 100, sellingPrice: 1800 },
  { name: "Fakhar", brand: "Lattafa", sizeMl: 100, sellingPrice: 2200 },
  { name: "Qimmah", brand: "Lattafa", sizeMl: 100, sellingPrice: 1800 },
  { name: "Just Aswad", brand: "Lattafa", sizeMl: 100, sellingPrice: 2000 },
  { name: "Ideal", brand: "Other", sizeMl: 100, sellingPrice: 1800 },
  { name: "Afeef", brand: "Other", sizeMl: 100, sellingPrice: 3500 },
];

export const seedProducts = mutation({
  args: {},
  handler: async (ctx) => {
    const toSlug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const brandMap = new Map<string, string>();

    const categorySlug = toSlug("EDP");
    const existingCat = await ctx.db.query("categories").withIndex("by_slug", (q) => q.eq("slug", categorySlug)).first();
    const categoryId = existingCat
      ? existingCat._id
      : await ctx.db.insert("categories", { name: "EDP", slug: categorySlug, isActive: true, createdAt: Date.now() });

    let created = 0;

    for (const item of CATALOGUE) {
      const brandSlug = toSlug(item.brand);
      if (!brandMap.has(brandSlug)) {
        const existing = await ctx.db.query("brands").withIndex("by_slug", (q) => q.eq("slug", brandSlug)).first();
        brandMap.set(brandSlug, existing
          ? existing._id
          : await ctx.db.insert("brands", { name: item.brand, slug: brandSlug, isActive: true, createdAt: Date.now() }));
      }
      const brandId = brandMap.get(brandSlug)!;

      const existingProducts = await ctx.db.query("products")
        .withIndex("by_brand", (q) => q.eq("brandId", brandId as never))
        .collect();
      const found = existingProducts.find((p) => p.name.toLowerCase() === item.name.toLowerCase());
      const productId = found
        ? found._id
        : await ctx.db.insert("products", {
            name: item.name,
            brandId: brandId as never,
            categoryId: categoryId as never,
            isActive: true,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });

      const existingVariant = await ctx.db.query("productVariants")
        .withIndex("by_product", (q) => q.eq("productId", productId as never))
        .first();
      if (!existingVariant) {
        const brandCode = item.brand.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
        const nameCode = item.name.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
        await ctx.db.insert("productVariants", {
          productId: productId as never,
          sku: `${brandCode}-${nameCode}-${item.sizeMl}ML`,
          barcode: undefined,
          sizeMl: item.sizeMl,
          costPrice: 0,
          sellingPrice: item.sellingPrice,
          stockQuantity: 0,
          lowStockThreshold: 3,
          isTester: false,
          isActive: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        created++;
      }
    }

    return { created };
  },
});

export const clearProducts = mutation({
  args: {},
  handler: async (ctx) => {
    const variants = await ctx.db.query("productVariants").collect();
    for (const v of variants) await ctx.db.delete(v._id);
    const products = await ctx.db.query("products").collect();
    for (const p of products) await ctx.db.delete(p._id);
    return { deleted: products.length };
  },
});
