import { mutation } from "./_generated/server";

export const clearProducts = mutation({
  args: {},
  handler: async (ctx) => {
    const tables = ["productVariants", "products", "brands", "categories", "stockMovements", "sales", "customers", "purchaseOrders", "expenses", "suppliers"] as const;
    let deleted = 0;
    for (const table of tables) {
      const rows = await ctx.db.query(table).collect();
      for (const row of rows) {
        await ctx.db.delete(row._id);
        deleted++;
      }
    }
    return { message: `Cleared ${deleted} records` };
  },
});

export const seedDatabase = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existingUsers = await ctx.db.query("users").collect();
    if (existingUsers.length > 0) return { message: "Already seeded" };

    const now = Date.now();

    // ─── DEFAULT SETTINGS ───
    const defaultSettings = [
      { key: "shop_name", value: "Perfume Shop" },
      { key: "shop_phone", value: "" },
      { key: "shop_address", value: "Nairobi, Kenya" },
      { key: "shop_logo_url", value: "" },
      { key: "currency", value: "KES" },
      { key: "currency_symbol", value: "KSh" },
      { key: "tax_rate", value: "0.16" },
      { key: "tax_inclusive", value: "true" },
      { key: "receipt_footer", value: "Thank you for shopping with us!" },
      { key: "receipt_show_logo", value: "true" },
      { key: "mpesa_shortcode", value: "174379" },
      { key: "mpesa_passkey", value: "" },
      { key: "mpesa_consumer_key", value: "" },
      { key: "mpesa_consumer_secret", value: "" },
      { key: "mpesa_environment", value: "sandbox" },
      { key: "low_stock_default", value: "5" },
      { key: "loyalty_points_rate", value: "100" },
    ];

    for (const s of defaultSettings) {
      await ctx.db.insert("settings", { ...s, updatedAt: now });
    }

    // ─── USERS ───
    await ctx.db.insert("users", {
      name: "Admin",
      email: "admin@perfumepos.com",
      role: "admin",
      pin: "1234",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("users", {
      name: "Cashier",
      email: "cashier@perfumepos.com",
      role: "cashier",
      pin: "0000",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    // ─── BRANDS ───
    const brandNames = [
      "Versace", "Dior", "Tom Ford", "Chanel", "Gucci",
      "Prada", "YSL", "Armani", "Burberry", "Dolce & Gabbana",
      "Hugo Boss", "Calvin Klein", "Jean Paul Gaultier", "Givenchy", "Hermès",
      "Bvlgari", "Creed", "Montblanc", "Azzaro", "Issey Miyake"
    ];

    const brandIds: Record<string, string> = {};
    for (const name of brandNames) {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const id = await ctx.db.insert("brands", { name, slug, isActive: true, createdAt: now });
      brandIds[name] = id;
    }

    // ─── CATEGORIES ───
    const categoryData = [
      { name: "Men", slug: "men" },
      { name: "Women", slug: "women" },
      { name: "Unisex", slug: "unisex" },
      { name: "Oud/Arabian", slug: "oud-arabian" },
      { name: "Gift Set", slug: "gift-set" },
      { name: "Travel Size", slug: "travel-size" },
    ];

    const catIds: Record<string, string> = {};
    for (const cat of categoryData) {
      const id = await ctx.db.insert("categories", { ...cat, isActive: true, createdAt: now });
      catIds[cat.name] = id;
    }

    // ─── PRODUCTS ───
    type ProductSeed = {
      name: string;
      brand: string;
      category: string;
      description?: string;
      variants: Array<{ sizeMl: number; costPrice: number; sellingPrice: number; stock: number }>;
    };

    const products: ProductSeed[] = [
      { name: "Eros EDT", brand: "Versace", category: "Men", description: "Inspired by the God of love, a fresh fougère fragrance.", variants: [{ sizeMl: 50, costPrice: 1800, sellingPrice: 3200, stock: 15 }, { sizeMl: 100, costPrice: 2800, sellingPrice: 4500, stock: 10 }, { sizeMl: 200, costPrice: 4500, sellingPrice: 6800, stock: 5 }] },
      { name: "Sauvage EDP", brand: "Dior", category: "Men", description: "A powerful and wild fragrance with bergamot and pepper.", variants: [{ sizeMl: 60, costPrice: 3000, sellingPrice: 5500, stock: 12 }, { sizeMl: 100, costPrice: 4500, sellingPrice: 8200, stock: 8 }] },
      { name: "Oud Wood EDP", brand: "Tom Ford", category: "Unisex", description: "Rare oud wood with sandalwood and rosewood.", variants: [{ sizeMl: 50, costPrice: 9000, sellingPrice: 15000, stock: 6 }, { sizeMl: 100, costPrice: 13000, sellingPrice: 22000, stock: 3 }] },
      { name: "No. 5 EDP", brand: "Chanel", category: "Women", description: "The iconic floral aldehyde fragrance since 1921.", variants: [{ sizeMl: 50, costPrice: 4500, sellingPrice: 7500, stock: 8 }, { sizeMl: 100, costPrice: 7000, sellingPrice: 12000, stock: 5 }] },
      { name: "Guilty EDP", brand: "Gucci", category: "Women", description: "Bright and floral with pink pepper and geranium.", variants: [{ sizeMl: 50, costPrice: 3500, sellingPrice: 5800, stock: 10 }, { sizeMl: 90, costPrice: 5500, sellingPrice: 9200, stock: 6 }] },
      { name: "Candy EDP", brand: "Prada", category: "Women", description: "Sweet and gourmand with caramel and benzoin.", variants: [{ sizeMl: 50, costPrice: 3200, sellingPrice: 5500, stock: 9 }, { sizeMl: 80, costPrice: 4800, sellingPrice: 8200, stock: 5 }] },
      { name: "Black Opium EDP", brand: "YSL", category: "Women", description: "Addictive and seductive with coffee and vanilla.", variants: [{ sizeMl: 30, costPrice: 2500, sellingPrice: 4200, stock: 14 }, { sizeMl: 50, costPrice: 3800, sellingPrice: 6500, stock: 9 }, { sizeMl: 90, costPrice: 6000, sellingPrice: 10500, stock: 4 }] },
      { name: "Acqua di Giò EDP", brand: "Armani", category: "Men", description: "Aromatic aquatic fragrance with marine accords.", variants: [{ sizeMl: 40, costPrice: 2200, sellingPrice: 3800, stock: 12 }, { sizeMl: 75, costPrice: 3500, sellingPrice: 6200, stock: 7 }, { sizeMl: 125, costPrice: 5500, sellingPrice: 9500, stock: 4 }] },
      { name: "Brit EDP", brand: "Burberry", category: "Women", description: "Elegant and warm with almond and tonka bean.", variants: [{ sizeMl: 50, costPrice: 2800, sellingPrice: 4800, stock: 11 }, { sizeMl: 100, costPrice: 4200, sellingPrice: 7200, stock: 6 }] },
      { name: "Light Blue EDT", brand: "Dolce & Gabbana", category: "Women", description: "Fresh and feminine with Sicilian lemon and apple.", variants: [{ sizeMl: 50, costPrice: 2500, sellingPrice: 4200, stock: 13 }, { sizeMl: 100, costPrice: 3800, sellingPrice: 6500, stock: 8 }] },
      { name: "Boss Bottled EDT", brand: "Hugo Boss", category: "Men", description: "A distinguished scent with apple, cinnamon and sandalwood.", variants: [{ sizeMl: 50, costPrice: 2000, sellingPrice: 3500, stock: 15 }, { sizeMl: 100, costPrice: 3000, sellingPrice: 5200, stock: 10 }] },
      { name: "Eternity EDP", brand: "Calvin Klein", category: "Women", description: "Fresh floral with sandalwood and musk.", variants: [{ sizeMl: 50, costPrice: 1800, sellingPrice: 3200, stock: 16 }, { sizeMl: 100, costPrice: 2800, sellingPrice: 5000, stock: 10 }] },
      { name: "Le Male EDT", brand: "Jean Paul Gaultier", category: "Men", description: "Iconic masculine fragrance with lavender and vanilla.", variants: [{ sizeMl: 75, costPrice: 2800, sellingPrice: 4800, stock: 10 }, { sizeMl: 125, costPrice: 4200, sellingPrice: 7200, stock: 5 }] },
      { name: "Gentleman EDP", brand: "Givenchy", category: "Men", description: "A noble and modern fragrance with iris and patchouli.", variants: [{ sizeMl: 60, costPrice: 3200, sellingPrice: 5500, stock: 9 }, { sizeMl: 100, costPrice: 4800, sellingPrice: 8500, stock: 5 }] },
      { name: "Terre d'Hermès EDP", brand: "Hermès", category: "Men", description: "A virile and earthy fragrance with orange and vetiver.", variants: [{ sizeMl: 75, costPrice: 5500, sellingPrice: 9500, stock: 7 }, { sizeMl: 100, costPrice: 7000, sellingPrice: 12000, stock: 4 }] },
      { name: "Man in Black EDP", brand: "Bvlgari", category: "Men", description: "Dark, intense and sensuous with rum and tobacco.", variants: [{ sizeMl: 60, costPrice: 3500, sellingPrice: 6000, stock: 8 }, { sizeMl: 100, costPrice: 5200, sellingPrice: 9000, stock: 5 }] },
      { name: "Aventus EDP", brand: "Creed", category: "Men", description: "Bold and sophisticated with pineapple, birch and musk.", variants: [{ sizeMl: 50, costPrice: 15000, sellingPrice: 25000, stock: 4 }, { sizeMl: 100, costPrice: 25000, sellingPrice: 42000, stock: 2 }] },
      { name: "Legend EDT", brand: "Montblanc", category: "Men", description: "Fresh aromatic with bergamot, lavender and sandalwood.", variants: [{ sizeMl: 50, costPrice: 1500, sellingPrice: 2800, stock: 20 }, { sizeMl: 100, costPrice: 2200, sellingPrice: 4200, stock: 14 }] },
      { name: "Chrome EDT", brand: "Azzaro", category: "Men", description: "Clean and fresh with anise, pineapple and cedar.", variants: [{ sizeMl: 50, costPrice: 1400, sellingPrice: 2500, stock: 18 }, { sizeMl: 100, costPrice: 2000, sellingPrice: 3800, stock: 12 }] },
      { name: "L'Eau d'Issey EDT", brand: "Issey Miyake", category: "Unisex", description: "Clean aquatic fragrance inspired by the freshness of water.", variants: [{ sizeMl: 50, costPrice: 1800, sellingPrice: 3200, stock: 15 }, { sizeMl: 100, costPrice: 2800, sellingPrice: 5000, stock: 9 }] },
      { name: "Oud Intense EDP", brand: "Tom Ford", category: "Oud/Arabian", description: "Smoky and intense oud with saffron and rose.", variants: [{ sizeMl: 50, costPrice: 11000, sellingPrice: 18000, stock: 4 }, { sizeMl: 100, costPrice: 18000, sellingPrice: 30000, stock: 2 }] },
      { name: "Rose Prick EDP", brand: "Tom Ford", category: "Women", description: "Turkish rose and thorny stems for a striking signature.", variants: [{ sizeMl: 50, costPrice: 9500, sellingPrice: 16000, stock: 5 }] },
      { name: "Coco Mademoiselle EDP", brand: "Chanel", category: "Women", description: "Fresh and spirited with patchouli and vetiver.", variants: [{ sizeMl: 50, costPrice: 5000, sellingPrice: 8500, stock: 8 }, { sizeMl: 100, costPrice: 7500, sellingPrice: 13500, stock: 4 }] },
      { name: "Bloom EDP", brand: "Gucci", category: "Women", description: "White floral with jasmine, tuberose and Rangoon creeper.", variants: [{ sizeMl: 50, costPrice: 3200, sellingPrice: 5500, stock: 10 }, { sizeMl: 100, costPrice: 5000, sellingPrice: 8800, stock: 6 }] },
      { name: "Baccarat Rouge 540 EDP", brand: "YSL", category: "Unisex", description: "Luxurious amber floral with saffron and cedarwood.", variants: [{ sizeMl: 35, costPrice: 8000, sellingPrice: 14000, stock: 5 }, { sizeMl: 70, costPrice: 13000, sellingPrice: 22000, stock: 3 }] },
      { name: "Si EDP", brand: "Armani", category: "Women", description: "Elegant with modern chypre, blackcurrant and rose.", variants: [{ sizeMl: 30, costPrice: 2800, sellingPrice: 4800, stock: 11 }, { sizeMl: 50, costPrice: 4200, sellingPrice: 7200, stock: 7 }, { sizeMl: 100, costPrice: 7000, sellingPrice: 12000, stock: 4 }] },
      { name: "Her EDP", brand: "Burberry", category: "Women", description: "Fruity floral with strawberry, jasmine and musk.", variants: [{ sizeMl: 50, costPrice: 2800, sellingPrice: 4800, stock: 12 }, { sizeMl: 100, costPrice: 4500, sellingPrice: 7800, stock: 6 }] },
      { name: "The One EDP", brand: "Dolce & Gabbana", category: "Men", description: "Oriental and spicy with tobacco, ginger and cardamom.", variants: [{ sizeMl: 50, costPrice: 2800, sellingPrice: 4800, stock: 10 }, { sizeMl: 100, costPrice: 4200, sellingPrice: 7200, stock: 6 }] },
      { name: "Alive EDP", brand: "Hugo Boss", category: "Men", description: "Fresh woody with apple, ginger and cedarwood.", variants: [{ sizeMl: 40, costPrice: 1800, sellingPrice: 3200, stock: 14 }, { sizeMl: 60, costPrice: 2500, sellingPrice: 4500, stock: 9 }] },
      { name: "CK One EDT", brand: "Calvin Klein", category: "Unisex", description: "A fresh shared fragrance for a man and a woman.", variants: [{ sizeMl: 100, costPrice: 1500, sellingPrice: 2800, stock: 25 }, { sizeMl: 200, costPrice: 2500, sellingPrice: 4500, stock: 12 }] },
    ];

    for (const p of products) {
      const brandId = brandIds[p.brand];
      const categoryId = catIds[p.category];
      if (!brandId || !categoryId) continue;

      const brandCode = p.brand.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
      const productCode = p.name.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const productId = await ctx.db.insert("products", {
        name: p.name,
        brandId: brandId as any,
        categoryId: categoryId as any,
        description: p.description,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });

      for (const v of p.variants) {
        await ctx.db.insert("productVariants", {
          productId,
          sku: `${brandCode}-${productCode}-${v.sizeMl}ML`,
          sizeMl: v.sizeMl,
          costPrice: v.costPrice,
          sellingPrice: v.sellingPrice,
          stockQuantity: v.stock,
          lowStockThreshold: 5,
          isTester: false,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    // ─── SAMPLE SUPPLIER ───
    await ctx.db.insert("suppliers", {
      name: "Premier Fragrance Distributors",
      contactName: "James Kariuki",
      phone: "0722000001",
      email: "james@premierfragrance.co.ke",
      address: "Industrial Area, Nairobi",
      isActive: true,
      createdAt: now,
    });

    return { message: "Database seeded successfully" };
  },
});
