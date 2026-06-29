import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { AdminLayout } from "../components/layout/AdminLayout";
import { StatCard } from "../components/ui/StatCard";
import { formatCurrency, formatCurrencyShort, formatDateTime } from "../lib/utils";
import { StatusBadge, StockBadge } from "../components/ui/Badge";
import { SkeletonCard, Skeleton } from "../components/ui/Skeleton";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { DollarSign, ShoppingCart, Package, TrendingUp } from "lucide-react";

export function DashboardPage() {
  const stats = useQuery(api.reports.getDashboardStats);
  const lowStock = useQuery(api.inventory.getLowStock);
  const recentSales = useQuery(api.sales.list, { status: "completed", limit: 5 });

  if (!stats) {
    return (
      <AdminLayout title="Dashboard">
        {/* KPI skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        {/* Charts skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="md:col-span-2 bg-white border border-[#E0E0E0] rounded-md p-4">
            <Skeleton className="h-3 w-40 mb-4" />
            <Skeleton className="h-48 w-full" />
          </div>
          <div className="bg-white border border-[#E0E0E0] rounded-md p-4 space-y-3">
            <Skeleton className="h-3 w-32 mb-2" />
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}
          </div>
        </div>
        {/* Bottom row skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-[#E0E0E0] rounded-md p-4 space-y-3">
            <Skeleton className="h-3 w-28 mb-2" />
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
          <div className="bg-white border border-[#E0E0E0] rounded-md p-4 space-y-3">
            <Skeleton className="h-3 w-28 mb-2" />
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dashboard">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        <StatCard
          title="Today's Revenue"
          value={formatCurrencyShort(stats.todayRevenue)}
          icon={<DollarSign size={16} />}
        />
        <StatCard
          title="Transactions Today"
          value={stats.todayTransactions.toString()}
          icon={<ShoppingCart size={16} />}
        />
        <StatCard
          title="Items Sold Today"
          value={stats.todayItems.toString()}
          icon={<Package size={16} />}
        />
        <StatCard
          title="Avg. Transaction"
          value={formatCurrencyShort(stats.avgTransactionValue)}
          icon={<TrendingUp size={16} />}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Revenue Chart */}
        <div className="md:col-span-2 bg-white border border-[#E0E0E0] rounded-md p-4">
          <p className="text-sm font-medium uppercase tracking-wider text-[#6B6B6B] mb-4">Revenue — Last 7 Days</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.revenueByDay} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#6B6B6B" }} />
              <YAxis tick={{ fontSize: 11, fill: "#6B6B6B" }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value) => [formatCurrency(Number(value)), "Revenue"]}
                contentStyle={{ fontSize: 12, border: "1px solid #E0E0E0", borderRadius: 4 }}
              />
              <Bar dataKey="revenue" fill="#1A8FD1" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Breakdown */}
        <div className="bg-white border border-[#E0E0E0] rounded-md p-4">
          <p className="text-sm font-medium uppercase tracking-wider text-[#6B6B6B] mb-4">Today's Payments</p>
          <div className="space-y-3">
            {Object.entries(stats.paymentBreakdown).map(([method, amount]) => {
              const total = Object.values(stats.paymentBreakdown).reduce((a, b) => a + b, 0);
              const pct = total > 0 ? (amount / total) * 100 : 0;
              return (
                <div key={method}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize text-[#1A8FD1]">{method}</span>
                    <span className="font-mono text-[#1A8FD1]">{formatCurrencyShort(amount)}</span>
                  </div>
                  <div className="h-1.5 bg-[#F0F0F0] rounded-full">
                    <div
                      className="h-1.5 bg-[#1A8FD1] rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Low Stock Alerts */}
        <div className="bg-white border border-[#E0E0E0] rounded-md p-4">
          <p className="text-sm font-medium uppercase tracking-wider text-[#6B6B6B] mb-3">Low Stock Alerts</p>
          {(lowStock ?? []).slice(0, 5).length === 0 ? (
            <p className="text-sm text-[#9B9B9B]">All stock levels are healthy.</p>
          ) : (
            <div className="space-y-2">
              {(lowStock ?? []).slice(0, 5).map((item) => (
                <div key={item._id} className="flex items-center justify-between py-1.5 border-b border-[#F0F0F0] last:border-0">
                  <div>
                    <p className="text-sm font-medium text-[#1A8FD1]">{item.productName} {item.sizeMl}ml</p>
                    <p className="text-sm text-[#9B9B9B]">{item.brandName} · {item.sku}</p>
                  </div>
                  <StockBadge quantity={item.stockQuantity} threshold={item.lowStockThreshold} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Sales */}
        <div className="bg-white border border-[#E0E0E0] rounded-md p-4">
          <p className="text-sm font-medium uppercase tracking-wider text-[#6B6B6B] mb-3">Recent Sales</p>
          {(recentSales ?? []).slice(0, 5).length === 0 ? (
            <p className="text-sm text-[#9B9B9B]">No sales yet today.</p>
          ) : (
            <div className="space-y-2">
              {(recentSales ?? []).slice(0, 5).map((sale) => (
                <div key={sale._id} className="flex items-center justify-between py-1.5 border-b border-[#F0F0F0] last:border-0">
                  <div>
                    <p className="text-sm font-medium text-[#1A8FD1]">{sale.saleNumber}</p>
                    <p className="text-sm text-[#9B9B9B]">{formatDateTime(sale.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono font-semibold">{formatCurrencyShort(sale.grandTotal)}</p>
                    <StatusBadge status={sale.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
