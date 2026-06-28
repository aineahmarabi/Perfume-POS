import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { AdminLayout } from "../components/layout/AdminLayout";
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from "../components/ui/Table";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { StatusBadge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
import { SkeletonTable } from "../components/ui/Skeleton";
import { Plus, Building2, Edit } from "lucide-react";

interface SupplierForm {
  name: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
}

export function SuppliersPage() {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SupplierForm>({ name: "", contactName: "", phone: "", email: "", address: "" });
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  const suppliers = useQuery(api.suppliers.list, {});
  const createSupplier = useMutation(api.suppliers.create);
  const updateSupplier = useMutation(api.suppliers.update);
  const removeSupplier = useMutation(api.suppliers.remove);

  const openAdd = () => {
    setEditingId(null);
    setForm({ name: "", contactName: "", phone: "", email: "", address: "" });
    setFormError("");
    setShowModal(true);
  };

  const openEdit = (s: NonNullable<typeof suppliers>[0]) => {
    setEditingId(s._id);
    setForm({ name: s.name, contactName: s.contactName ?? "", phone: s.phone, email: s.email ?? "", address: s.address ?? "" });
    setFormError("");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      setFormError("Name and phone are required");
      return;
    }
    setLoading(true);
    setFormError("");
    try {
      if (editingId) {
        await updateSupplier({
          id: editingId as Id<"suppliers">,
          name: form.name, contactName: form.contactName || undefined,
          phone: form.phone, email: form.email || undefined,
          address: form.address || undefined, isActive: true,
        });
      } else {
        await createSupplier({
          name: form.name, contactName: form.contactName || undefined,
          phone: form.phone, email: form.email || undefined,
          address: form.address || undefined,
        });
      }
      setShowModal(false);
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Suppliers">
      <div className="flex justify-end mb-4">
        <Button onClick={openAdd}><Plus size={16} /> Add Supplier</Button>
      </div>

      {!suppliers ? (
        <SkeletonTable rows={6} cols={5} />
      ) : suppliers.length === 0 ? (
        <EmptyState message="No suppliers yet." icon={<Building2 size={32} strokeWidth={1.5} />} action={{ label: "Add Supplier", onClick: openAdd }} />
      ) : (
        <div className="bg-white border border-[#E0E0E0] rounded-md overflow-hidden">
          <Table>
            <TableHead>
              <tr>
                <TableHeader>Name</TableHeader>
                <TableHeader>Contact</TableHeader>
                <TableHeader>Phone</TableHeader>
                <TableHeader>Email</TableHeader>
                <TableHeader align="center">Status</TableHeader>
                <TableHeader align="right">Actions</TableHeader>
              </tr>
            </TableHead>
            <TableBody>
              {suppliers.map((s) => (
                <TableRow key={s._id}>
                  <TableCell><span className="font-medium">{s.name}</span></TableCell>
                  <TableCell>{s.contactName ?? "—"}</TableCell>
                  <TableCell>{s.phone}</TableCell>
                  <TableCell>{s.email ?? "—"}</TableCell>
                  <TableCell align="center"><StatusBadge status={s.isActive ? "active" : "inactive"} /></TableCell>
                  <TableCell align="right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(s)} className="text-sm text-[#2563EB] hover:underline flex items-center gap-1">
                        <Edit size={12} /> Edit
                      </button>
                      {s.isActive && (
                        <button onClick={() => removeSupplier({ id: s._id as Id<"suppliers"> })} className="text-sm text-[#DC2626] hover:underline">
                          Deactivate
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? "Edit Supplier" : "Add Supplier"} maxWidth="sm">
        <div className="space-y-3">
          <Input label="Company Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
          <Input label="Contact Person" value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
          <Input label="Phone *" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} type="tel" />
          <Input label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" />
          <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          {formError && <p className="text-sm text-[#DC2626]">{formError}</p>}
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleSave} loading={loading} className="flex-1">{editingId ? "Save" : "Add Supplier"}</Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}

