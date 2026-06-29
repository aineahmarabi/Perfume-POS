import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { AdminLayout } from "../components/layout/AdminLayout";
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from "../components/ui/Table";
import { SearchInput } from "../components/ui/SearchInput";
import { Select } from "../components/ui/Select";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { Badge, StatusBadge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
import { SkeletonTable } from "../components/ui/Skeleton";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { formatCurrency, formatDateTime } from "../lib/utils";
import { useAuth } from "../hooks/useAuth";
import { Receipt } from "lucide-react";

export function SalesPage() {
  const { user, isAdmin } = useAuth();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterMethod, setFilterMethod] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedSale, setSelectedSale] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const salesQuery = useQuery(api.sales.list, {
    cashierId: isAdmin ? undefined : (user?._id as Id<"users"> | undefined),
    status: filterStatus || undefined,
    paymentMethod: filterMethod || undefined,
    startDate: startDate ? new Date(startDate).getTime() : undefined,
    endDate: endDate ? new Date(endDate + "T23:59:59").getTime() : undefined,
    limit: 200,
  });

  const saleDetail = useQuery(api.sales.get, selectedSale ? { id: selectedSale as Id<"sales"> } : "skip");
  const deleteSale = useMutation(api.sales.deleteSale);

  const filtered = (salesQuery ?? []).filter((s) => {
    const q = search.toLowerCase();
    return !q || s.saleNumber.toLowerCase().includes(q);
  });

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await deleteSale({ saleId: deleteId as Id<"sales"> });
      setDeleteId(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const methodLabel: Record<string, string> = { cash: "Cash", mpesa: "M-Pesa", card: "Card", split: "Split" };

  return (
    <AdminLayout title="Sales History">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 mb-4">
        <SearchInput placeholder="Search by sale number..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full sm:w-48" />
        <div className="flex gap-2">
          <Select
            options={[{ value: "", label: "All Statuses" }, { value: "completed", label: "Completed" }, { value: "on_hold", label: "On Hold" }]}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="flex-1 sm:w-36 sm:flex-none"
          />
          <Select
            options={[{ value: "", label: "All Methods" }, { value: "cash", label: "Cash" }, { value: "mpesa", label: "M-Pesa" }, { value: "card", label: "Card" }, { value: "split", label: "Split" }]}
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
            className="flex-1 sm:w-32 sm:flex-none"
          />
        </div>
        <div className="flex gap-2">
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="flex-1 sm:w-36 sm:flex-none" />
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="flex-1 sm:w-36 sm:flex-none" />
        </div>
        <span className="text-sm text-[#9B9B9B]">{filtered.length} results</span>
      </div>

      {!salesQuery ? (
        <SkeletonTable rows={6} cols={5} />
      ) : filtered.length === 0 ? (
        <EmptyState message="No sales found." icon={<Receipt size={32} strokeWidth={1.5} />} />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white border border-[#E0E0E0] rounded-md overflow-hidden">
            <Table>
              <TableHead>
                <tr>
                  <TableHeader>Sale #</TableHeader>
                  <TableHeader>Date / Time</TableHeader>
                  <TableHeader>Items</TableHeader>
                  <TableHeader>Payment</TableHeader>
                  <TableHeader align="right">Total</TableHeader>
                  <TableHeader align="center">Status</TableHeader>
                  {isAdmin && <TableHeader align="center">Actions</TableHeader>}
                </tr>
              </TableHead>
              <TableBody>
                {filtered.map((sale) => (
                  <TableRow key={sale._id} onClick={() => setSelectedSale(sale._id)}>
                    <TableCell><span className="font-mono text-sm">{sale.saleNumber}</span></TableCell>
                    <TableCell>{formatDateTime(sale.createdAt)}</TableCell>
                    <TableCell>
                      <Badge variant="default">{sale.items.reduce((s, i) => s + i.quantity, 0)} items</Badge>
                    </TableCell>
                    <TableCell><span className="capitalize">{methodLabel[sale.paymentMethod] ?? sale.paymentMethod}</span></TableCell>
                    <TableCell align="right"><span className="font-mono font-semibold">{formatCurrency(sale.grandTotal)}</span></TableCell>
                    <TableCell align="center"><StatusBadge status={sale.status} /></TableCell>
                    {isAdmin && (
                      <TableCell align="center">
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteId(sale._id); }}
                          className="text-sm text-[#DC2626] hover:underline"
                        >
                          Delete
                        </button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((sale) => (
              <div key={sale._id} className="bg-white border border-[#E0E0E0] rounded-md p-4" onClick={() => setSelectedSale(sale._id)}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-sm font-semibold">{sale.saleNumber}</p>
                    <p className="text-xs text-[#9B9B9B] mt-0.5">{formatDateTime(sale.createdAt)}</p>
                  </div>
                  <StatusBadge status={sale.status} />
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-3 pt-3 border-t border-[#F0F0F0] text-sm">
                  <div>
                    <p className="text-xs text-[#9B9B9B]">Items</p>
                    <p>{sale.items.reduce((s, i) => s + i.quantity, 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#9B9B9B]">Payment</p>
                    <p className="capitalize">{methodLabel[sale.paymentMethod] ?? sale.paymentMethod}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-[#9B9B9B]">Total</p>
                    <p className="font-mono font-semibold text-base">{formatCurrency(sale.grandTotal)}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t border-[#F0F0F0]">
                  <button className="flex-1 text-sm text-[#1E1B3A] py-1.5 border border-[#E0E0E0] rounded-md" onClick={(e) => { e.stopPropagation(); setSelectedSale(sale._id); }}>
                    View
                  </button>
                  {isAdmin && (
                    <button className="flex-1 text-sm text-[#DC2626] py-1.5 border border-[#E0E0E0] rounded-md" onClick={(e) => { e.stopPropagation(); setDeleteId(sale._id); }}>
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Sale Detail Modal */}
      <Modal isOpen={!!selectedSale} onClose={() => setSelectedSale(null)} title="Sale Detail" maxWidth="lg">
        {saleDetail && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-[#6B6B6B]">Sale Number</p>
                <p className="font-mono font-medium">{saleDetail.saleNumber}</p>
              </div>
              <div>
                <p className="text-xs text-[#6B6B6B]">Date & Time</p>
                <p>{formatDateTime(saleDetail.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-[#6B6B6B]">Cashier</p>
                <p>{saleDetail.cashierName}</p>
              </div>
              <div>
                <p className="text-xs text-[#6B6B6B]">Customer</p>
                <p>{saleDetail.customerName}</p>
              </div>
            </div>

            {/* Desktop items table */}
            <div className="hidden sm:block border border-[#E0E0E0] rounded-md overflow-hidden">
              <Table>
                <TableHead>
                  <tr>
                    <TableHeader>Item</TableHeader>
                    <TableHeader align="center">Qty</TableHeader>
                    <TableHeader align="right">Unit Price</TableHeader>
                    <TableHeader align="right">Total</TableHeader>
                  </tr>
                </TableHead>
                <TableBody>
                  {saleDetail.items.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <p className="font-medium">{item.productName} {item.brandName} {item.sizeMl}ml</p>
                        <p className="text-sm text-[#9B9B9B]">{item.sku}</p>
                      </TableCell>
                      <TableCell align="center">{item.quantity}</TableCell>
                      <TableCell align="right"><span className="font-mono">{formatCurrency(item.unitPrice)}</span></TableCell>
                      <TableCell align="right"><span className="font-mono">{formatCurrency(item.lineTotal)}</span></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile items cards */}
            <div className="sm:hidden space-y-2">
              {saleDetail.items.map((item, i) => (
                <div key={i} className="border border-[#E0E0E0] rounded-md p-3">
                  <p className="font-medium text-sm">{item.productName} {item.brandName} {item.sizeMl}ml</p>
                  <p className="text-xs text-[#9B9B9B] mb-2">{item.sku}</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#9B9B9B]">Qty: {item.quantity} x {formatCurrency(item.unitPrice)}</span>
                    <span className="font-mono font-semibold">{formatCurrency(item.lineTotal)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-[#F7F7F7] rounded-md p-3 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-[#6B6B6B]">Subtotal</span><span className="font-mono">{formatCurrency(saleDetail.subtotal)}</span></div>
              {saleDetail.discountTotal > 0 && <div className="flex justify-between text-[#16A34A]"><span>Discount</span><span className="font-mono">-{formatCurrency(saleDetail.discountTotal)}</span></div>}
              <div className="flex justify-between"><span className="text-[#6B6B6B]">VAT</span><span className="font-mono">{formatCurrency(saleDetail.taxAmount)}</span></div>
              <div className="flex justify-between font-semibold text-sm pt-1 border-t border-[#E0E0E0]"><span>Grand Total</span><span className="font-mono">{formatCurrency(saleDetail.grandTotal)}</span></div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Sale"
        message="This will permanently delete this sale. It will be completely removed and cannot be recovered."
        confirmLabel="Delete"
        loading={deleteLoading}
      />
    </AdminLayout>
  );
}
