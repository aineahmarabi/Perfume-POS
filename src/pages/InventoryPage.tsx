import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { AdminLayout } from "../components/layout/AdminLayout";
import { Tabs, TabList, Tab, TabPanel } from "../components/ui/Tabs";
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from "../components/ui/Table";
import { SearchInput } from "../components/ui/SearchInput";
import { Modal } from "../components/ui/Modal";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { StockBadge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
import { formatCurrency, formatDate } from "../lib/utils";
import { useAuth } from "../hooks/useAuth";
import { STOCK_ADJUSTMENT_REASONS } from "../lib/constants";
import { AlertTriangle, Clock } from "lucide-react";
import { SkeletonTable } from "../components/ui/Skeleton";

export function InventoryPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [adjustVariantId, setAdjustVariantId] = useState<string | null>(null);
  const [newQty, setNewQty] = useState("");
  const [adjustReason, setAdjustReason] = useState("count_correction");
  const [adjustLoading, setAdjustLoading] = useState(false);
  const [adjustError, setAdjustError] = useState("");

  const stockOverview = useQuery(api.inventory.getStockOverview);
  const lowStock = useQuery(api.inventory.getLowStock);
  const expiryAlerts = useQuery(api.inventory.getExpiryAlerts, { daysAhead: 90 });
  const adjustStock = useMutation(api.inventory.adjustStock);

  const adjustingItem = adjustVariantId
    ? (stockOverview ?? []).find((v) => v._id === adjustVariantId)
    : null;

  const filtered = (stockOverview ?? []).filter((v) => {
    const s = search.toLowerCase();
    return !s ||
      v.productName.toLowerCase().includes(s) ||
      v.brandName.toLowerCase().includes(s) ||
      v.sku.toLowerCase().includes(s);
  });

  const openAdjust = (id: string, currentQty: number) => {
    setAdjustVariantId(id);
    setNewQty(currentQty.toString());
    setAdjustReason("count_correction");
    setAdjustError("");
  };

  const handleAdjust = async () => {
    if (!adjustVariantId || !user) return;
    const qty = parseInt(newQty);
    if (isNaN(qty) || qty < 0) {
      setAdjustError("Enter a valid quantity (0 or more)");
      return;
    }
    setAdjustLoading(true);
    setAdjustError("");
    try {
      await adjustStock({
        variantId: adjustVariantId as Id<"productVariants">,
        newQuantity: qty,
        reason: adjustReason,
        performedBy: user._id,
      });
      setAdjustVariantId(null);
    } catch (e: unknown) {
      setAdjustError(e instanceof Error ? e.message : "Adjustment failed");
    } finally {
      setAdjustLoading(false);
    }
  };

  return (
    <AdminLayout title="Inventory">
      <Tabs defaultTab="stock">
        <TabList className="mb-4">
          <Tab value="stock">Stock Overview</Tab>
          <Tab value="low">
            Low Stock
            {(lowStock?.length ?? 0) > 0 && (
              <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full text-sm bg-amber-100 text-amber-700">
                {lowStock?.length}
              </span>
            )}
          </Tab>
          <Tab value="expiry">
            Expiry Alerts
            {(expiryAlerts?.length ?? 0) > 0 && (
              <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full text-sm bg-red-100 text-red-700">
                {expiryAlerts?.length}
              </span>
            )}
          </Tab>
        </TabList>

        {/* ── STOCK OVERVIEW ── */}
        <TabPanel value="stock">
          <div className="mb-3">
            <SearchInput
              placeholder="Search by product, brand, or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full"
            />
          </div>
          {!stockOverview ? (
            <SkeletonTable rows={7} cols={5} />
          ) : filtered.length === 0 ? (
            <EmptyState message="No stock items found." icon={<AlertTriangle size={32} strokeWidth={1.5} />} />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block bg-white border border-[#E0E0E0] rounded-md overflow-hidden">
                <Table>
                  <TableHead>
                    <tr>
                      <TableHeader>Product</TableHeader>
                      <TableHeader>Brand</TableHeader>
                      <TableHeader>SKU</TableHeader>
                      <TableHeader align="center">Size</TableHeader>
                      <TableHeader align="right">Cost</TableHeader>
                      <TableHeader align="right">Price</TableHeader>
                      <TableHeader align="center">Stock</TableHeader>
                      <TableHeader align="center">Status</TableHeader>
                      <TableHeader align="center">Actions</TableHeader>
                    </tr>
                  </TableHead>
                  <TableBody>
                    {filtered.map((v) => (
                      <TableRow key={v._id}>
                        <TableCell><span className="font-medium">{v.productName}</span></TableCell>
                        <TableCell>{v.brandName}</TableCell>
                        <TableCell><span className="font-mono text-sm">{v.sku}</span></TableCell>
                        <TableCell align="center">{v.sizeMl}ml</TableCell>
                        <TableCell align="right"><span className="font-mono">{formatCurrency(v.costPrice)}</span></TableCell>
                        <TableCell align="right"><span className="font-mono">{formatCurrency(v.sellingPrice)}</span></TableCell>
                        <TableCell align="center"><span className="font-mono font-medium">{v.stockQuantity}</span></TableCell>
                        <TableCell align="center"><StockBadge quantity={v.stockQuantity} threshold={v.lowStockThreshold} /></TableCell>
                        <TableCell align="center">
                          <button onClick={() => openAdjust(v._id, v.stockQuantity)} className="text-sm text-[#2563EB] hover:underline">
                            Adjust
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden space-y-3">
                {filtered.map((v) => (
                  <div key={v._id} className="bg-white border border-[#E0E0E0] rounded-md p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-[#6B1A2A] truncate">{v.productName}</p>
                        <p className="text-xs text-[#9B9B9B]">{v.brandName} · {v.sizeMl}ml</p>
                        <p className="text-xs font-mono text-[#9B9B9B] mt-0.5">{v.sku}</p>
                      </div>
                      <StockBadge quantity={v.stockQuantity} threshold={v.lowStockThreshold} />
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-[#F0F0F0] text-center text-xs">
                      <div>
                        <p className="text-[#9B9B9B]">Cost</p>
                        <p className="font-mono font-medium text-sm">{formatCurrency(v.costPrice)}</p>
                      </div>
                      <div>
                        <p className="text-[#9B9B9B]">Price</p>
                        <p className="font-mono font-medium text-sm">{formatCurrency(v.sellingPrice)}</p>
                      </div>
                      <div>
                        <p className="text-[#9B9B9B]">Stock</p>
                        <p className="font-mono font-semibold text-sm">{v.stockQuantity}</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-[#F0F0F0]">
                      <button onClick={() => openAdjust(v._id, v.stockQuantity)} className="w-full text-sm text-[#2563EB] py-1.5 border border-[#E0E0E0] rounded-md">
                        Adjust Stock
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </TabPanel>

        {/* ── LOW STOCK ── */}
        <TabPanel value="low">
          {!lowStock ? (
            <SkeletonTable rows={5} cols={4} />
          ) : lowStock.length === 0 ? (
            <EmptyState message="All stock levels are healthy." icon={<AlertTriangle size={32} strokeWidth={1.5} />} />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block bg-white border border-[#E0E0E0] rounded-md overflow-hidden">
                <Table>
                  <TableHead>
                    <tr>
                      <TableHeader>Product</TableHeader>
                      <TableHeader>Brand</TableHeader>
                      <TableHeader>SKU</TableHeader>
                      <TableHeader align="center">Stock</TableHeader>
                      <TableHeader align="center">Threshold</TableHeader>
                      <TableHeader align="center">Status</TableHeader>
                      <TableHeader align="center">Action</TableHeader>
                    </tr>
                  </TableHead>
                  <TableBody>
                    {lowStock.map((v) => (
                      <TableRow key={v._id}>
                        <TableCell><span className="font-medium">{v.productName} {v.sizeMl}ml</span></TableCell>
                        <TableCell>{v.brandName}</TableCell>
                        <TableCell><span className="font-mono text-sm">{v.sku}</span></TableCell>
                        <TableCell align="center"><span className="font-mono font-medium text-[#DC2626]">{v.stockQuantity}</span></TableCell>
                        <TableCell align="center">{v.lowStockThreshold}</TableCell>
                        <TableCell align="center"><StockBadge quantity={v.stockQuantity} threshold={v.lowStockThreshold} /></TableCell>
                        <TableCell align="center">
                          <button onClick={() => openAdjust(v._id, v.stockQuantity)} className="text-sm text-[#2563EB] hover:underline">
                            Adjust Stock
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden space-y-3">
                {lowStock.map((v) => (
                  <div key={v._id} className="bg-white border border-[#E0E0E0] rounded-md p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-[#6B1A2A]">{v.productName} {v.sizeMl}ml</p>
                        <p className="text-xs text-[#9B9B9B]">{v.brandName} · {v.sku}</p>
                      </div>
                      <StockBadge quantity={v.stockQuantity} threshold={v.lowStockThreshold} />
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-[#F0F0F0] text-xs">
                      <div>
                        <p className="text-[#9B9B9B]">Current Stock</p>
                        <p className="font-mono font-semibold text-[#DC2626] text-sm">{v.stockQuantity}</p>
                      </div>
                      <div>
                        <p className="text-[#9B9B9B]">Threshold</p>
                        <p className="font-mono text-sm">{v.lowStockThreshold}</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-[#F0F0F0]">
                      <button onClick={() => openAdjust(v._id, v.stockQuantity)} className="w-full text-sm text-[#2563EB] py-1.5 border border-[#E0E0E0] rounded-md">
                        Adjust Stock
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </TabPanel>

        {/* ── EXPIRY ALERTS ── */}
        <TabPanel value="expiry">
          {!expiryAlerts ? (
            <SkeletonTable rows={5} cols={4} />
          ) : expiryAlerts.length === 0 ? (
            <EmptyState message="No expiry alerts within 90 days." icon={<Clock size={32} strokeWidth={1.5} />} />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block bg-white border border-[#E0E0E0] rounded-md overflow-hidden">
                <Table>
                  <TableHead>
                    <tr>
                      <TableHeader>Product</TableHeader>
                      <TableHeader>Brand</TableHeader>
                      <TableHeader>SKU</TableHeader>
                      <TableHeader align="center">Stock</TableHeader>
                      <TableHeader align="center">Expires</TableHeader>
                      <TableHeader align="center">Days Left</TableHeader>
                    </tr>
                  </TableHead>
                  <TableBody>
                    {expiryAlerts.map((v) => {
                      const daysLeft = v.expiryDate
                        ? Math.ceil((v.expiryDate - Date.now()) / (1000 * 60 * 60 * 24))
                        : null;
                      return (
                        <TableRow key={v._id}>
                          <TableCell><span className="font-medium">{v.productName} {v.sizeMl}ml</span></TableCell>
                          <TableCell>{v.brandName}</TableCell>
                          <TableCell><span className="font-mono text-sm">{v.sku}</span></TableCell>
                          <TableCell align="center">{v.stockQuantity}</TableCell>
                          <TableCell align="center">{v.expiryDate ? formatDate(v.expiryDate) : "-"}</TableCell>
                          <TableCell align="center">
                            {daysLeft !== null && (
                              <span className={`font-medium ${daysLeft <= 30 ? "text-[#DC2626]" : daysLeft <= 60 ? "text-[#D97706]" : "text-[#6B6B6B]"}`}>
                                {daysLeft} days
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden space-y-3">
                {expiryAlerts.map((v) => {
                  const daysLeft = v.expiryDate
                    ? Math.ceil((v.expiryDate - Date.now()) / (1000 * 60 * 60 * 24))
                    : null;
                  return (
                    <div key={v._id} className="bg-white border border-[#E0E0E0] rounded-md p-4">
                      <p className="font-medium text-sm text-[#6B1A2A]">{v.productName} {v.sizeMl}ml</p>
                      <p className="text-xs text-[#9B9B9B] mt-0.5">{v.brandName} · {v.sku}</p>
                      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-[#F0F0F0] text-xs text-center">
                        <div>
                          <p className="text-[#9B9B9B]">Stock</p>
                          <p className="font-mono font-medium text-sm">{v.stockQuantity}</p>
                        </div>
                        <div>
                          <p className="text-[#9B9B9B]">Expires</p>
                          <p className="text-sm">{v.expiryDate ? formatDate(v.expiryDate) : "-"}</p>
                        </div>
                        <div>
                          <p className="text-[#9B9B9B]">Days Left</p>
                          {daysLeft !== null && (
                            <p className={`font-semibold text-sm ${daysLeft <= 30 ? "text-[#DC2626]" : daysLeft <= 60 ? "text-[#D97706]" : "text-[#6B6B6B]"}`}>
                              {daysLeft}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </TabPanel>
      </Tabs>

      {/* Adjust Stock Modal */}
      <Modal
        isOpen={!!adjustVariantId}
        onClose={() => setAdjustVariantId(null)}
        title="Adjust Stock"
        maxWidth="sm"
      >
        {adjustingItem && (
          <div className="space-y-4">
            <div className="bg-[#F7F7F7] rounded-md p-3">
              <p className="text-sm font-medium">{adjustingItem.productName} {adjustingItem.sizeMl}ml</p>
              <p className="text-sm text-[#6B6B6B]">{adjustingItem.sku} · Current stock: {adjustingItem.stockQuantity}</p>
            </div>
            <Input
              label="New Stock Quantity"
              type="number"
              min="0"
              value={newQty}
              onChange={(e) => setNewQty(e.target.value)}
              autoFocus
            />
            <Select
              label="Reason"
              options={STOCK_ADJUSTMENT_REASONS.map((r) => ({ value: r.value, label: r.label }))}
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
            />
            {adjustError && <p className="text-sm text-[#DC2626]">{adjustError}</p>}
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setAdjustVariantId(null)} className="flex-1">Cancel</Button>
              <Button onClick={handleAdjust} loading={adjustLoading} className="flex-1">Save Adjustment</Button>
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}
