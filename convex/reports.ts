import { query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const allSales = await ctx.db.query("sales").collect();
    const todaySales = allSales.filter(
      (s) => s.createdAt >= startOfDay.getTime() && s.status === "completed"
    );

    const todayRevenue = todaySales.reduce((sum, s) => sum + s.grandTotal, 0);
    const todayTransactions = todaySales.length;
    const todayItems = todaySales.reduce(
      (sum, s) => sum + s.items.reduce((itemSum, i) => itemSum + i.quantity, 0),
      0
    );
    const avgTransactionValue = todayTransactions > 0 ? todayRevenue / todayTransactions : 0;

    // Last 7 days revenue
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      d.setHours(0, 0, 0, 0);
      return d;
    });

    const revenueByDay = last7Days.map((day) => {
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);
      const daySales = allSales.filter(
        (s) =>
          s.createdAt >= day.getTime() &&
          s.createdAt < nextDay.getTime() &&
          s.status === "completed"
      );
      return {
        date: day.toLocaleDateString("en-KE", { weekday: "short", month: "short", day: "numeric" }),
        revenue: daySales.reduce((sum, s) => sum + s.grandTotal, 0),
        transactions: daySales.length,
      };
    });

    // Payment method breakdown today
    const paymentBreakdown = {
      cash: todaySales.filter((s) => s.paymentMethod === "cash").reduce((sum, s) => sum + s.grandTotal, 0),
      mpesa: todaySales.filter((s) => s.paymentMethod === "mpesa").reduce((sum, s) => sum + s.grandTotal, 0),
      card: todaySales.filter((s) => s.paymentMethod === "card").reduce((sum, s) => sum + s.grandTotal, 0),
      split: todaySales.filter((s) => s.paymentMethod === "split").reduce((sum, s) => sum + s.grandTotal, 0),
    };

    return {
      todayRevenue,
      todayTransactions,
      todayItems,
      avgTransactionValue,
      revenueByDay,
      paymentBreakdown,
    };
  },
});

export const getSalesReport = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const sales = await ctx.db.query("sales").collect();
    const filtered = sales.filter(
      (s) =>
        s.createdAt >= args.startDate &&
        s.createdAt <= args.endDate &&
        s.status === "completed"
    );

    const totalRevenue = filtered.reduce((sum, s) => sum + s.grandTotal, 0);
    const totalTransactions = filtered.length;
    const totalItems = filtered.reduce(
      (sum, s) => sum + s.items.reduce((itemSum, i) => itemSum + i.quantity, 0),
      0
    );
    const totalDiscount = filtered.reduce((sum, s) => sum + s.discountTotal, 0);
    const totalTax = filtered.reduce((sum, s) => sum + s.taxAmount, 0);

    return {
      totalRevenue,
      totalTransactions,
      totalItems,
      totalDiscount,
      totalTax,
      sales: filtered,
    };
  },
});

export const getProductReport = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const sales = await ctx.db.query("sales").collect();
    const filtered = sales.filter(
      (s) =>
        s.createdAt >= args.startDate &&
        s.createdAt <= args.endDate &&
        s.status === "completed"
    );

    const productStats: Record<string, { name: string; brand: string; sku: string; quantity: number; revenue: number }> = {};

    for (const sale of filtered) {
      for (const item of sale.items) {
        const key = item.sku;
        if (!productStats[key]) {
          productStats[key] = {
            name: `${item.productName} ${item.sizeMl}ml`,
            brand: item.brandName,
            sku: item.sku,
            quantity: 0,
            revenue: 0,
          };
        }
        productStats[key].quantity += item.quantity;
        productStats[key].revenue += item.lineTotal;
      }
    }

    const sorted = Object.values(productStats).sort((a, b) => b.revenue - a.revenue);
    return {
      topByRevenue: sorted.slice(0, 10),
      topByQuantity: [...sorted].sort((a, b) => b.quantity - a.quantity).slice(0, 10),
      slowMovers: sorted.slice(-10).reverse(),
    };
  },
});

export const getProfitReport = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const sales = await ctx.db.query("sales").collect();
    const expenses = await ctx.db.query("expenses").collect();

    const filteredSales = sales.filter(
      (s) =>
        s.createdAt >= args.startDate &&
        s.createdAt <= args.endDate &&
        s.status === "completed"
    );

    const filteredExpenses = expenses.filter(
      (e) => e.date >= args.startDate && e.date <= args.endDate
    );

    // Calculate COGS from variants
    let totalCOGS = 0;
    for (const sale of filteredSales) {
      for (const item of sale.items) {
        const variant = await ctx.db.get(item.variantId);
        if (variant) {
          totalCOGS += variant.costPrice * item.quantity;
        }
      }
    }

    const totalRevenue = filteredSales.reduce((sum, s) => sum + s.grandTotal, 0);
    const grossProfit = totalRevenue - totalCOGS;
    const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = grossProfit - totalExpenses;

    const expensesByCategory = filteredExpenses.reduce(
      (acc, e) => {
        acc[e.category] = (acc[e.category] ?? 0) + e.amount;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      totalRevenue,
      totalCOGS,
      grossProfit,
      grossMargin,
      totalExpenses,
      netProfit,
      expensesByCategory,
    };
  },
});

export const getStaffReport = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const sales = await ctx.db.query("sales").collect();
    const filtered = sales.filter(
      (s) =>
        s.createdAt >= args.startDate &&
        s.createdAt <= args.endDate &&
        s.status === "completed"
    );

    const staffStats: Record<string, { name: string; transactions: number; revenue: number }> = {};

    for (const sale of filtered) {
      const key = sale.cashierId as string;
      if (!staffStats[key]) {
        const cashier = await ctx.db.get(sale.cashierId);
        staffStats[key] = {
          name: cashier?.name ?? "Unknown",
          transactions: 0,
          revenue: 0,
        };
      }
      staffStats[key].transactions++;
      staffStats[key].revenue += sale.grandTotal;
    }

    return Object.values(staffStats).sort((a, b) => b.revenue - a.revenue);
  },
});

export const getDashboardKPIs = query({
  args: {},
  handler: async (ctx) => {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    const allSales = await ctx.db.query("sales").collect();
    const todaySales = allSales.filter(
      (s) => s.createdAt >= startOfToday.getTime() && s.status === "completed"
    );
    const yesterdaySales = allSales.filter(
      (s) =>
        s.createdAt >= startOfYesterday.getTime() &&
        s.createdAt < startOfToday.getTime() &&
        s.status === "completed"
    );

    const todayRevenue = todaySales.reduce((sum, s) => sum + s.grandTotal, 0);
    const yesterdayRevenue = yesterdaySales.reduce((sum, s) => sum + s.grandTotal, 0);
    const todayTransactions = todaySales.length;
    const yesterdayTransactions = yesterdaySales.length;
    const todayItems = todaySales.reduce(
      (sum, s) => sum + s.items.reduce((a, i) => a + i.quantity, 0),
      0
    );
    const yesterdayItems = yesterdaySales.reduce(
      (sum, s) => sum + s.items.reduce((a, i) => a + i.quantity, 0),
      0
    );

    let todayCOGS = 0;
    for (const sale of todaySales) {
      for (const item of sale.items) {
        const variant = await ctx.db.get(item.variantId);
        if (variant) todayCOGS += variant.costPrice * item.quantity;
      }
    }
    let yesterdayCOGS = 0;
    for (const sale of yesterdaySales) {
      for (const item of sale.items) {
        const variant = await ctx.db.get(item.variantId);
        if (variant) yesterdayCOGS += variant.costPrice * item.quantity;
      }
    }
    const todayGrossProfit = todayRevenue - todayCOGS;

    const pctChange = (today: number, yesterday: number): number | null => {
      if (yesterday === 0) return today > 0 ? 100 : null;
      return ((today - yesterday) / yesterday) * 100;
    };

    return {
      revenue: { today: todayRevenue, pctChange: pctChange(todayRevenue, yesterdayRevenue) },
      transactions: { today: todayTransactions, pctChange: pctChange(todayTransactions, yesterdayTransactions) },
      items: { today: todayItems, pctChange: pctChange(todayItems, yesterdayItems) },
      grossProfit: {
        today: todayGrossProfit,
        pctChange: pctChange(todayGrossProfit, yesterdayRevenue - yesterdayCOGS),
      },
    };
  },
});

export const getRevenueByDayDashboard = query({
  args: { period: v.union(v.literal("today"), v.literal("week"), v.literal("month")) },
  handler: async (ctx, args) => {
    const now = new Date();
    const allSales = await ctx.db.query("sales").collect();
    const completed = allSales.filter((s) => s.status === "completed");

    if (args.period === "today") {
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      return Array.from({ length: 24 }, (_, h) => {
        const start = new Date(startOfDay);
        start.setHours(h);
        const end = new Date(startOfDay);
        end.setHours(h + 1);
        const revenue = completed
          .filter((s) => s.createdAt >= start.getTime() && s.createdAt < end.getTime())
          .reduce((sum, s) => sum + s.grandTotal, 0);
        return { date: `${String(h).padStart(2, "0")}:00`, revenue };
      });
    }

    const days = args.period === "week" ? 7 : 30;
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (days - 1 - i));
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      const revenue = completed
        .filter((s) => s.createdAt >= d.getTime() && s.createdAt < next.getTime())
        .reduce((sum, s) => sum + s.grandTotal, 0);
      return {
        date:
          args.period === "week"
            ? d.toLocaleDateString("en-KE", { weekday: "short" })
            : d.toLocaleDateString("en-KE", { month: "short", day: "numeric" }),
        revenue,
      };
    });
  },
});

export const getTopSellingProducts = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 5;
    const allSales = await ctx.db.query("sales").collect();
    const completed = allSales.filter((s) => s.status === "completed");

    const stats: Record<
      string,
      { variantId: string; productName: string; brandName: string; sizeMl: number; sku: string; qtySold: number; revenue: number }
    > = {};

    for (const sale of completed) {
      for (const item of sale.items) {
        const key = item.variantId as unknown as string;
        if (!stats[key]) {
          stats[key] = {
            variantId: key,
            productName: item.productName,
            brandName: item.brandName,
            sizeMl: item.sizeMl,
            sku: item.sku,
            qtySold: 0,
            revenue: 0,
          };
        }
        stats[key].qtySold += item.quantity;
        stats[key].revenue += item.lineTotal;
      }
    }

    const sorted = Object.values(stats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);

    return Promise.all(
      sorted.map(async (entry) => {
        const variant = await ctx.db.get(entry.variantId as unknown as Id<"productVariants">);
        const product = variant ? await ctx.db.get(variant.productId) : null;
        return {
          productName: entry.productName,
          brandName: entry.brandName,
          sizeMl: entry.sizeMl,
          sku: entry.sku,
          qtySold: entry.qtySold,
          revenue: entry.revenue,
          imageUrl: product?.imageUrl ?? null,
        };
      })
    );
  },
});

export const getSalesByCategory = query({
  args: {},
  handler: async (ctx) => {
    const allSales = await ctx.db.query("sales").collect();
    const completed = allSales.filter((s) => s.status === "completed");

    const catRevenue: Record<string, { name: string; revenue: number }> = {};

    for (const sale of completed) {
      for (const item of sale.items) {
        const variant = await ctx.db.get(item.variantId);
        if (!variant) continue;
        const product = await ctx.db.get(variant.productId);
        if (!product) continue;
        const category = await ctx.db.get(product.categoryId);
        if (!category) continue;
        const key = category._id as unknown as string;
        if (!catRevenue[key]) catRevenue[key] = { name: category.name, revenue: 0 };
        catRevenue[key].revenue += item.lineTotal;
      }
    }

    const total = Object.values(catRevenue).reduce((s, c) => s + c.revenue, 0);
    return Object.values(catRevenue)
      .sort((a, b) => b.revenue - a.revenue)
      .map((c) => ({
        name: c.name,
        revenue: c.revenue,
        percentage: total > 0 ? (c.revenue / total) * 100 : 0,
      }));
  },
});

export const getPaymentSummaryToday = query({
  args: {},
  handler: async (ctx) => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const allSales = await ctx.db.query("sales").collect();
    const todaySales = allSales.filter(
      (s) => s.createdAt >= startOfDay.getTime() && s.status === "completed"
    );
    const methods: Record<string, number> = { cash: 0, mpesa: 0, card: 0, split: 0 };
    for (const sale of todaySales) {
      if (methods[sale.paymentMethod] !== undefined) {
        methods[sale.paymentMethod] += sale.grandTotal;
      }
    }
    const total = Object.values(methods).reduce((a, b) => a + b, 0);
    return Object.entries(methods)
      .filter(([, amount]) => amount > 0)
      .map(([method, amount]) => ({
        method,
        amount,
        percentage: total > 0 ? (amount / total) * 100 : 0,
      }));
  },
});

export const getLowStockDashboard = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 5;
    const variants = await ctx.db.query("productVariants").collect();
    const lowStock = variants
      .filter((vr) => vr.isActive && vr.stockQuantity <= vr.lowStockThreshold)
      .sort((a, b) => a.stockQuantity - b.stockQuantity)
      .slice(0, limit);

    return Promise.all(
      lowStock.map(async (variant) => {
        const product = await ctx.db.get(variant.productId);
        const brand = product ? await ctx.db.get(product.brandId) : null;
        return {
          variantId: variant._id as string,
          productName: product?.name ?? "",
          brandName: brand?.name ?? "",
          sizeMl: variant.sizeMl,
          sku: variant.sku,
          stockQuantity: variant.stockQuantity,
          lowStockThreshold: variant.lowStockThreshold,
          imageUrl: product?.imageUrl ?? null,
        };
      })
    );
  },
});
