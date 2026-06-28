import { query } from "./_generated/server";
import { v } from "convex/values";

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
