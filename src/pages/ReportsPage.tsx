import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { AdminLayout } from "../components/layout/AdminLayout";
import { Tabs, TabList, Tab, TabPanel } from "../components/ui/Tabs";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { StatCard } from "../components/ui/StatCard";
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from "../components/ui/Table";
import { SkeletonTable, SkeletonCard } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { formatCurrency, formatCurrencyShort } from "../lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { BarChart3 } from "lucide-react";

function useDateRange() {
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const [startDate, setStartDate] = useState(firstOfMonth.toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split("T")[0]);

  const startTs = new Date(startDate).getTime();
  const endTs = new Date(endDate + "T23:59:59").getTime();

  return { startDate, setStartDate, endDate, setEndDate, startTs, endTs };
}

export function ReportsPage() {
  return (
    <AdminLayout title="Reports">
      <Tabs defaultTab="sales">
        <TabList className="mb-6">
          <Tab value="sales">Sales</Tab>
          <Tab value="products">Products</Tab>
          <Tab value="profit">Profit & Loss</Tab>
          <Tab value="payments">Payments</Tab>
          <Tab value="staff">Staff</Tab>
        </TabList>

        <TabPanel value="sales"><SalesReport /></TabPanel>
        <TabPanel value="products"><ProductReport /></TabPanel>
        <TabPanel value="profit"><ProfitReport /></TabPanel>
        <TabPanel value="payments"><PaymentReport /></TabPanel>
        <TabPanel value="staff"><StaffReport /></TabPanel>
      </Tabs>
    </AdminLayout>
  );
}

function DateRangeFilter({ startDate, endDate, onStartChange, onEndChange }: {
  startDate: string; endDate: string; onStartChange: (v: string) => void; onEndChange: (v: string) => void;
}) {
  const setPreset = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    onStartChange(start.toISOString().split("T")[0]);
    onEndChange(end.toISOString().split("T")[0]);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 mb-6">
      <div className="flex items-center gap-2 flex-1">
        <Input type="date" value={startDate} onChange={(e) => onStartChange(e.target.value)} className="flex-1" />
        <span className="text-[#9B9B9B] flex-shrink-0">to</span>
        <Input type="date" value={endDate} onChange={(e) => onEndChange(e.target.value)} className="flex-1" />
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" onClick={() => setPreset(7)}>7 Days</Button>
        <Button size="sm" variant="secondary" onClick={() => setPreset(30)}>30 Days</Button>
        <Button size="sm" variant="secondary" onClick={() => setPreset(90)}>90 Days</Button>
      </div>
    </div>
  );
}

function SalesReport() {
  const { startDate, setStartDate, endDate, setEndDate, startTs, endTs } = useDateRange();
  const data = useQuery(api.reports.getSalesReport, { startDate: startTs, endDate: endTs });

  if (!data) return (
    <div>
      <DateRangeFilter startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">{Array.from({length:4}).map((_,i)=><SkeletonCard key={i}/>)}</div>
      <SkeletonTable rows={6} cols={4} />
    </div>
  );

  return (
    <div>
      <DateRangeFilter startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        <StatCard title="Revenue" value={formatCurrencyShort(data.totalRevenue)} />
        <StatCard title="Transactions" value={data.totalTransactions.toString()} />
        <StatCard title="Items Sold" value={data.totalItems.toString()} />
        <StatCard title="Total Discounts" value={formatCurrencyShort(data.totalDiscount)} />
      </div>
      {data.sales.length === 0 ? (
        <EmptyState message="No sales in this date range." icon={<BarChart3 size={32} strokeWidth={1.5} />} />
      ) : (
        <div className="bg-white border border-[#E0E0E0] rounded-md overflow-hidden">
          <Table>
            <TableHead>
              <tr>
                <TableHeader>Sale #</TableHeader>
                <TableHeader>Payment Method</TableHeader>
                <TableHeader align="center">Items</TableHeader>
                <TableHeader align="right">Total</TableHeader>
              </tr>
            </TableHead>
            <TableBody>
              {data.sales.slice(0, 50).map((s) => (
                <TableRow key={s._id}>
                  <TableCell><span className="font-mono text-sm">{s.saleNumber}</span></TableCell>
                  <TableCell className="capitalize">{s.paymentMethod}</TableCell>
                  <TableCell align="center">{s.items.length}</TableCell>
                  <TableCell align="right"><span className="font-mono">{formatCurrency(s.grandTotal)}</span></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function ProductReport() {
  const { startDate, setStartDate, endDate, setEndDate, startTs, endTs } = useDateRange();
  const data = useQuery(api.reports.getProductReport, { startDate: startTs, endDate: endTs });

  if (!data) return (
    <div>
      <DateRangeFilter startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SkeletonTable rows={6} cols={2} />
        <SkeletonTable rows={6} cols={2} />
      </div>
    </div>
  );

  return (
    <div>
      <DateRangeFilter startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-wider text-[#6B6B6B] mb-3">Top 10 by Revenue</p>
          <div className="bg-white border border-[#E0E0E0] rounded-md overflow-hidden">
            <Table>
              <TableHead><tr><TableHeader>Product</TableHeader><TableHeader align="right">Revenue</TableHeader></tr></TableHead>
              <TableBody>
                {data.topByRevenue.map((p, i) => (
                  <TableRow key={p.sku}>
                    <TableCell><span className="text-[#9B9B9B] mr-2">{i + 1}.</span>{p.name}</TableCell>
                    <TableCell align="right"><span className="font-mono">{formatCurrencyShort(p.revenue)}</span></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
        <div>
          <p className="text-sm font-medium uppercase tracking-wider text-[#6B6B6B] mb-3">Top 10 by Quantity</p>
          <div className="bg-white border border-[#E0E0E0] rounded-md overflow-hidden">
            <Table>
              <TableHead><tr><TableHeader>Product</TableHeader><TableHeader align="right">Units Sold</TableHeader></tr></TableHead>
              <TableBody>
                {data.topByQuantity.map((p, i) => (
                  <TableRow key={p.sku}>
                    <TableCell><span className="text-[#9B9B9B] mr-2">{i + 1}.</span>{p.name}</TableCell>
                    <TableCell align="right">{p.quantity}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfitReport() {
  const { startDate, setStartDate, endDate, setEndDate, startTs, endTs } = useDateRange();
  const data = useQuery(api.reports.getProfitReport, { startDate: startTs, endDate: endTs });

  if (!data) return (
    <div>
      <DateRangeFilter startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">{Array.from({length:3}).map((_,i)=><SkeletonCard key={i}/>)}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><SkeletonTable rows={5} cols={2}/><SkeletonTable rows={5} cols={2}/></div>
    </div>
  );

  return (
    <div>
      <DateRangeFilter startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard title="Total Revenue" value={formatCurrencyShort(data.totalRevenue)} />
        <StatCard title="Gross Profit" value={formatCurrencyShort(data.grossProfit)} subtitle={`Margin: ${data.grossMargin.toFixed(1)}%`} />
        <StatCard title="Net Profit" value={formatCurrencyShort(data.netProfit)} subtitle={`After ${formatCurrencyShort(data.totalExpenses)} expenses`} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-[#E0E0E0] rounded-md p-4">
          <p className="text-sm font-medium uppercase tracking-wider text-[#6B6B6B] mb-3">P&L Summary</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-[#6B6B6B]">Revenue</span><span className="font-mono">{formatCurrency(data.totalRevenue)}</span></div>
            <div className="flex justify-between"><span className="text-[#6B6B6B]">Cost of Goods</span><span className="font-mono text-[#DC2626]">-{formatCurrency(data.totalCOGS)}</span></div>
            <div className="flex justify-between font-medium pt-1 border-t border-[#E0E0E0]"><span>Gross Profit</span><span className="font-mono">{formatCurrency(data.grossProfit)}</span></div>
            <div className="flex justify-between"><span className="text-[#6B6B6B]">Expenses</span><span className="font-mono text-[#DC2626]">-{formatCurrency(data.totalExpenses)}</span></div>
            <div className="flex justify-between font-semibold text-sm pt-1 border-t border-[#E0E0E0]"><span>Net Profit</span><span className={`font-mono ${data.netProfit >= 0 ? "text-[#16A34A]" : "text-[#DC2626]"}`}>{formatCurrency(data.netProfit)}</span></div>
          </div>
        </div>
        <div className="bg-white border border-[#E0E0E0] rounded-md p-4">
          <p className="text-sm font-medium uppercase tracking-wider text-[#6B6B6B] mb-3">Expenses by Category</p>
          <div className="space-y-2 text-sm">
            {Object.entries(data.expensesByCategory).map(([cat, amount]) => (
              <div key={cat} className="flex justify-between">
                <span className="capitalize text-[#6B6B6B]">{cat}</span>
                <span className="font-mono">{formatCurrency(amount)}</span>
              </div>
            ))}
            {Object.keys(data.expensesByCategory).length === 0 && <p className="text-[#9B9B9B]">No expenses in this period.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentReport() {
  const { startDate, setStartDate, endDate, setEndDate, startTs, endTs } = useDateRange();
  const data = useQuery(api.reports.getSalesReport, { startDate: startTs, endDate: endTs });

  if (!data) return (
    <div>
      <DateRangeFilter startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><SkeletonTable rows={5} cols={2}/><SkeletonTable rows={5} cols={2}/></div>
    </div>
  );

  const breakdown = { cash: 0, mpesa: 0, card: 0, split: 0 };
  for (const s of data.sales) {
    breakdown[s.paymentMethod as keyof typeof breakdown] += s.grandTotal;
  }
  const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
  const chartData = Object.entries(breakdown).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
  const COLORS = ["#6B1A2A", "#16A34A", "#2563EB", "#D97706"];

  return (
    <div>
      <DateRangeFilter startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-[#E0E0E0] rounded-md p-4">
          <p className="text-sm font-medium uppercase tracking-wider text-[#6B6B6B] mb-4">Revenue by Payment Method</p>
          <div className="space-y-3">
            {chartData.map(({ name, value }, i) => (
              <div key={name}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{name}</span>
                  <span className="font-mono">{formatCurrencyShort(value)} ({total > 0 ? ((value / total) * 100).toFixed(1) : 0}%)</span>
                </div>
                <div className="h-2 bg-[#F0F0F0] rounded-full">
                  <div className="h-2 rounded-full" style={{ width: `${total > 0 ? (value / total) * 100 : 0}%`, backgroundColor: COLORS[i] }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white border border-[#E0E0E0] rounded-md p-4">
          <div className="w-full" style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={false} labelLine={false} fontSize={11}>
                  {chartData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function StaffReport() {
  const { startDate, setStartDate, endDate, setEndDate, startTs, endTs } = useDateRange();
  const data = useQuery(api.reports.getStaffReport, { startDate: startTs, endDate: endTs });

  if (!data) return (
    <div>
      <DateRangeFilter startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} />
      <SkeletonTable rows={5} cols={4} />
    </div>
  );

  return (
    <div>
      <DateRangeFilter startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} />
      {data.length === 0 ? (
        <EmptyState message="No staff sales data in this period." />
      ) : (
        <>
          <div className="bg-white border border-[#E0E0E0] rounded-md overflow-hidden mb-4">
            <Table>
              <TableHead>
                <tr>
                  <TableHeader>Staff Member</TableHeader>
                  <TableHeader align="center">Transactions</TableHeader>
                  <TableHeader align="right">Revenue</TableHeader>
                  <TableHeader align="right">Avg. Transaction</TableHeader>
                </tr>
              </TableHead>
              <TableBody>
                {data.map((s) => (
                  <TableRow key={s.name}>
                    <TableCell><span className="font-medium">{s.name}</span></TableCell>
                    <TableCell align="center">{s.transactions}</TableCell>
                    <TableCell align="right"><span className="font-mono">{formatCurrencyShort(s.revenue)}</span></TableCell>
                    <TableCell align="right"><span className="font-mono">{formatCurrencyShort(s.transactions > 0 ? s.revenue / s.transactions : 0)}</span></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="bg-white border border-[#E0E0E0] rounded-md p-4">
            <p className="text-sm font-medium uppercase tracking-wider text-[#6B6B6B] mb-4">Revenue by Staff</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6B6B6B" }} />
                <YAxis tick={{ fontSize: 11, fill: "#6B6B6B" }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ fontSize: 12, border: "1px solid #E0E0E0", borderRadius: 4 }} />
                <Bar dataKey="revenue" fill="#6B1A2A" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
