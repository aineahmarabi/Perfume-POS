import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { AdminLayout } from "../components/layout/AdminLayout";
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from "../components/ui/Table";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Modal } from "../components/ui/Modal";
import { StatusBadge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
import { SkeletonTable } from "../components/ui/Skeleton";
import { formatCurrency, formatDate } from "../lib/utils";
import { useAuth } from "../hooks/useAuth";
import { Plus, Truck } from "lucide-react";

interface POItem {
  variantId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitCost: number;
  lineTotal: number;
}

export function PurchasesPage() {
  const { user } = useAuth();
  const [showNew, setShowNew] = useState(false);
  const [selectedPO, setSelectedPO] = useState<string | null>(null);
  const [showReceive, setShowReceive] = useState(false);
  const [loading, setLoading] = useState(false);

  const [newPO, setNewPO] = useState({ supplierId: "", notes: "" });
  const [poItems, setPoItems] = useState<POItem[]>([]);
  const [formError, setFormError] = useState("");

  const orders = useQuery(api.purchaseOrders.list, {});
  const suppliers = useQuery(api.suppliers.list, { activeOnly: true });
  const stockOverview = useQuery(api.inventory.getStockOverview);
  const selectedOrder = useQuery(api.purchaseOrders.get, selectedPO ? { id: selectedPO as Id<"purchaseOrders"> } : "skip");

  const createPO = useMutation(api.purchaseOrders.create);
  const updateStatus = useMutation(api.purchaseOrders.updateStatus);
  const receiveStock = useMutation(api.purchaseOrders.receiveStock);

  const [receiveQtys, setReceiveQtys] = useState<Record<string, number>>({});

  const supplierOptions = (suppliers ?? []).map((s) => ({ value: s._id, label: s.name }));
  const variantOptions = (stockOverview ?? []).filter((v) => v.isActive && !v.isTester).map((v) => ({
    value: v._id,
    label: `${v.productName} ${v.sizeMl}ml - ${v.sku}`,
  }));

  const addPOItem = () => {
    setPoItems([...poItems, { variantId: "", productName: "", sku: "", quantity: 1, unitCost: 0, lineTotal: 0 }]);
  };

  const updatePOItem = (i: number, field: keyof POItem, value: string | number) => {
    const updated = [...poItems];
    if (field === "variantId" && typeof value === "string") {
      const variant = (stockOverview ?? []).find((v) => v._id === value);
      updated[i] = {
        ...updated[i],
        variantId: value,
        productName: variant ? `${variant.productName} ${variant.sizeMl}ml` : "",
        sku: variant?.sku ?? "",
        lineTotal: updated[i].quantity * (updated[i].unitCost || 0),
      };
    } else {
      if (field === "quantity") {
        updated[i].quantity = Number(value);
        updated[i].lineTotal = updated[i].quantity * updated[i].unitCost;
      } else if (field === "unitCost") {
        updated[i].unitCost = Number(value);
        updated[i].lineTotal = updated[i].quantity * updated[i].unitCost;
      } else if (field === "productName") {
        updated[i].productName = String(value);
      } else if (field === "sku") {
        updated[i].sku = String(value);
      }
    }
    setPoItems(updated);
  };

  const handleCreatePO = async () => {
    if (!newPO.supplierId) { setFormError("Select a supplier"); return; }
    if (poItems.length === 0 || poItems.some((i) => !i.variantId)) { setFormError("Add at least one item"); return; }
    setLoading(true);
    setFormError("");
    try {
      await createPO({
        supplierId: newPO.supplierId as Id<"suppliers">,
        items: poItems.map((i) => ({ ...i, variantId: i.variantId as Id<"productVariants"> })),
        totalAmount: poItems.reduce((sum, i) => sum + i.lineTotal, 0),
        notes: newPO.notes || undefined,
        createdBy: user!._id,
      });
      setShowNew(false);
      setPoItems([]);
      setNewPO({ supplierId: "", notes: "" });
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Create failed");
    } finally {
      setLoading(false);
    }
  };

  const handleReceive = async (isPartial: boolean) => {
    if (!selectedPO || !user) return;
    setLoading(true);
    try {
      await receiveStock({
        id: selectedPO as Id<"purchaseOrders">,
        receivedItems: Object.entries(receiveQtys).map(([variantId, quantityReceived]) => ({
          variantId: variantId as Id<"productVariants">,
          quantityReceived,
        })),
        performedBy: user._id,
        isPartial,
      });
      setShowReceive(false);
      setReceiveQtys({});
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Purchase Orders">
      <div className="flex justify-end mb-4">
        <Button onClick={() => setShowNew(true)}><Plus size={16} /> New Purchase Order</Button>
      </div>

      {!orders ? (
        <SkeletonTable rows={6} cols={5} />
      ) : orders.length === 0 ? (
        <EmptyState message="No purchase orders yet." icon={<Truck size={32} strokeWidth={1.5} />} action={{ label: "Create PO", onClick: () => setShowNew(true) }} />
      ) : (
        <div className="bg-white border border-[#E0E0E0] rounded-md overflow-hidden">
          <Table>
            <TableHead>
              <tr>
                <TableHeader>PO Number</TableHeader>
                <TableHeader>Supplier</TableHeader>
                <TableHeader align="center">Items</TableHeader>
                <TableHeader align="right">Total</TableHeader>
                <TableHeader align="center">Status</TableHeader>
                <TableHeader align="center">Date</TableHeader>
                <TableHeader align="center">Actions</TableHeader>
              </tr>
            </TableHead>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o._id} onClick={() => setSelectedPO(o._id)}>
                  <TableCell><span className="font-mono text-sm">{o.poNumber}</span></TableCell>
                  <TableCell>{o.supplierName}</TableCell>
                  <TableCell align="center">{o.items.length}</TableCell>
                  <TableCell align="right"><span className="font-mono">{formatCurrency(o.totalAmount)}</span></TableCell>
                  <TableCell align="center"><StatusBadge status={o.status} /></TableCell>
                  <TableCell align="center">{formatDate(o.createdAt)}</TableCell>
                  <TableCell align="center">
                    {o.status === "draft" && (
                      <button onClick={(e) => { e.stopPropagation(); updateStatus({ id: o._id as Id<"purchaseOrders">, status: "ordered" }); }} className="text-sm text-[#2563EB] hover:underline">Mark Ordered</button>
                    )}
                    {(o.status === "ordered" || o.status === "partial") && (
                      <button onClick={(e) => { e.stopPropagation(); setSelectedPO(o._id); setReceiveQtys({}); setShowReceive(true); }} className="text-sm text-[#16A34A] hover:underline">Receive Stock</button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* New PO Modal */}
      <Modal isOpen={showNew} onClose={() => setShowNew(false)} title="New Purchase Order" maxWidth="lg">
        <div className="space-y-4">
          <Select label="Supplier *" options={supplierOptions} value={newPO.supplierId} onChange={(e) => setNewPO({ ...newPO, supplierId: e.target.value })} placeholder="Select supplier" />
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium uppercase tracking-wider text-[#6B6B6B]">Items</p>
              <Button size="sm" variant="secondary" onClick={addPOItem}><Plus size={14} /> Add Item</Button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {poItems.map((item, i) => (
                <div key={i} className="grid grid-cols-4 gap-2 items-end">
                  <div className="col-span-2">
                    <Select label="Product" options={variantOptions} value={item.variantId} onChange={(e) => updatePOItem(i, "variantId", e.target.value)} placeholder="Select product" />
                  </div>
                  <Input label="Qty" type="number" min="1" value={item.quantity} onChange={(e) => updatePOItem(i, "quantity", parseInt(e.target.value) || 1)} />
                  <Input label="Unit Cost (KES)" type="number" value={item.unitCost} onChange={(e) => updatePOItem(i, "unitCost", parseFloat(e.target.value) || 0)} />
                </div>
              ))}
              {poItems.length === 0 && <p className="text-sm text-[#9B9B9B]">No items added yet.</p>}
            </div>
          </div>
          {poItems.length > 0 && (
            <div className="flex justify-end text-sm font-semibold">
              Total: {formatCurrency(poItems.reduce((s, i) => s + i.lineTotal, 0))}
            </div>
          )}
          <Input label="Notes (optional)" value={newPO.notes} onChange={(e) => setNewPO({ ...newPO, notes: e.target.value })} />
          {formError && <p className="text-sm text-[#DC2626]">{formError}</p>}
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setShowNew(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleCreatePO} loading={loading} className="flex-1">Create Purchase Order</Button>
          </div>
        </div>
      </Modal>

      {/* Receive Stock Modal */}
      <Modal isOpen={showReceive && !!selectedOrder} onClose={() => setShowReceive(false)} title="Receive Stock" maxWidth="md">
        {selectedOrder && (
          <div className="space-y-4">
            <p className="text-sm text-[#6B6B6B]">Enter received quantities for each item.</p>
            <div className="space-y-3">
              {selectedOrder.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.productName}</p>
                    <p className="text-sm text-[#9B9B9B]">{item.sku} - Ordered: {item.quantity}</p>
                  </div>
                  <Input
                    type="number"
                    min="0"
                    max={item.quantity}
                    value={receiveQtys[item.variantId] ?? item.quantity}
                    onChange={(e) => setReceiveQtys({ ...receiveQtys, [item.variantId]: parseInt(e.target.value) || 0 })}
                    className="w-24"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setShowReceive(false)} className="flex-1">Cancel</Button>
              <Button variant="secondary" onClick={() => handleReceive(true)} loading={loading} className="flex-1">Partial Receive</Button>
              <Button onClick={() => handleReceive(false)} loading={loading} className="flex-1">Full Receive</Button>
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}
