import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { AdminLayout } from "../components/layout/AdminLayout";
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from "../components/ui/Table";
import { SearchInput } from "../components/ui/SearchInput";
import { Select } from "../components/ui/Select";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Badge, StatusBadge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";

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
  const [voidId, setVoidId] = useState<string | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [voidLoading, setVoidLoading] = useState(false);
  const [voidError, setVoidError] = useState("");

  const salesQuery = useQuery(api.sales.list, {
    cashierId: isAdmin ? undefined : (user?._id as Id<"users"> | undefined),
    status: filterStatus || undefined,
    paymentMethod: filterMethod || undefined,
    startDate: startDate ? new Date(startDate).getTime() : undefined,
    endDate: endDate ? new Date(endDate + "T23:59:59").getTime() : undefined,
    limit: 200,
  });

  const saleDetail = useQuery(api.sales.get, selectedSale ? { id: selectedSale as Id<"sales"> } : "skip");
  const voidSale = useMutation(api.sales.voidSale);

  const filtered = (salesQuery ?? []).filter((s) => {
    const q = search.toLowerCase();
    return !q || s.saleNumber.toLowerCase().includes(q);
  });

  const handleVoid = async () => {
    if (!voidId || !voidReason.trim() || !user) return;
    setVoidLoading(true);
    setVoidError("");
    try {
      await voidSale({
        saleId: voidId as Id<"sales">,
        voidReason: voidReason.trim(),
        performedBy: user._id,
      });
      setVoidId(null);
      setVoidReason("");
    } catch (e: unknown) {
      setVoidError(e instanceof Error ? e.message : "Void failed");
    } finally {
      setVoidLoading(false);
    }
  };

  const methodLabel: Record<string, string> = { cash: "Cash", mpesa: "M-Pesa", card: "Card", split: "Split" };

  return (
    <AdminLayout title="Sales History">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <SearchInput placeholder="Search by sale number..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full sm:w-48" />
        <Select
          options={[{ value: "", label: "All Statuses" }, { value: "completed", label: "Completed" }, { value: "voided", label: "Voided" }, { value: "on_hold", label: "On Hold" }]}
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
        <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="flex-1 sm:w-36 sm:flex-none" />
        <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="flex-1 sm:w-36 sm:flex-none" />
        <span className="text-sm text-[#9B9B9B] w-full sm:w-auto">{filtered.length} results</span>
      </div>

      {!salesQuery ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState message="No sales found." icon={<Receipt size={32} strokeWidth={1.5} />} />
      ) : (
        <div className="bg-white border border-[#E0E0E0] rounded-md overflow-hidden">
          <Table>
            <TableHead>
              <tr>
                <TableHeader>Sale #</TableHeader>
                <TableHeader>Date / Time</TableHeader>
                <TableHeader>Items</TableHeader>
                <TableHeader>Payment</TableHeader>
                <TableHeader align="right">Total</TableHeader>
                <TableHeader align="center">Status</TableHeader>
                <TableHeader align="center">Actions</TableHeader>
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
                  <TableCell align="center">
                    {isAdmin && sale.status === "completed" && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setVoidId(sale._id); setVoidReason(""); setVoidError(""); }}
                        className="text-sm text-[#DC2626] hover:underline"
                      >
                        Void
                      </button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Sale Detail Modal */}
      <Modal isOpen={!!selectedSale && !voidId} onClose={() => setSelectedSale(null)} title="Sale Detail" maxWidth="lg">
        {saleDetail && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-sm text-[#6B6B6B]">Sale Number</p>
                <p className="font-mono font-medium">{saleDetail.saleNumber}</p>
              </div>
              <div>
                <p className="text-sm text-[#6B6B6B]">Date & Time</p>
                <p>{formatDateTime(saleDetail.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-[#6B6B6B]">Cashier</p>
                <p>{saleDetail.cashierName}</p>
              </div>
              <div>
                <p className="text-sm text-[#6B6B6B]">Customer</p>
                <p>{saleDetail.customerName}</p>
              </div>
            </div>

            <div className="border border-[#E0E0E0] rounded-md overflow-hidden">
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

            <div className="bg-[#F7F7F7] rounded-md p-3 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-[#6B6B6B]">Subtotal</span><span className="font-mono">{formatCurrency(saleDetail.subtotal)}</span></div>
              {saleDetail.discountTotal > 0 && <div className="flex justify-between text-[#16A34A]"><span>Discount</span><span className="font-mono">-{formatCurrency(saleDetail.discountTotal)}</span></div>}
              <div className="flex justify-between"><span className="text-[#6B6B6B]">VAT</span><span className="font-mono">{formatCurrency(saleDetail.taxAmount)}</span></div>
              <div className="flex justify-between font-semibold text-sm pt-1 border-t border-[#E0E0E0]"><span>Grand Total</span><span className="font-mono">{formatCurrency(saleDetail.grandTotal)}</span></div>
            </div>

            {saleDetail.voidReason && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-[#DC2626]">
                Void reason: {saleDetail.voidReason}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Void Sale */}
      <Modal isOpen={!!voidId} onClose={() => setVoidId(null)} title="Void Sale" maxWidth="sm">
        <div className="space-y-4">
          <p className="text-sm text-[#6B6B6B]">This will reverse stock and mark the sale as voided.</p>
          <Input
            label="Void Reason *"
            placeholder="Reason for voiding this sale..."
            value={voidReason}
            onChange={(e) => setVoidReason(e.target.value)}
            autoFocus
          />
          {voidError && <p className="text-sm text-[#DC2626]">{voidError}</p>}
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setVoidId(null)} className="flex-1">Cancel</Button>
            <Button variant="danger" onClick={handleVoid} loading={voidLoading} disabled={!voidReason.trim()} className="flex-1">
              Void Sale
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
