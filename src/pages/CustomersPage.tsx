import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { AdminLayout } from "../components/layout/AdminLayout";
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from "../components/ui/Table";
import { SearchInput } from "../components/ui/SearchInput";
import { Modal } from "../components/ui/Modal";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { EmptyState } from "../components/ui/EmptyState";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { formatCurrency, formatDate } from "../lib/utils";
import { useDebounce } from "../hooks/useDebounce";
import { Plus, Users } from "lucide-react";

export function CustomersPage() {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 200);
  const allCustomers = useQuery(api.customers.list);
  const byName = useQuery(api.customers.searchByName, { name: debouncedSearch });
  const byPhone = useQuery(api.customers.searchByPhone, { phone: debouncedSearch });
  const customerSales = useQuery(api.customers.getCustomerSales, profileId ? { customerId: profileId as Id<"customers"> } : "skip");

  const createCustomer = useMutation(api.customers.create);
  const updateCustomer = useMutation(api.customers.update);

  const displayCustomers = debouncedSearch.length >= 2
    ? [...(byName ?? []), ...(byPhone ?? [])].filter((c, i, arr) => arr.findIndex((x) => x._id === c._id) === i)
    : (allCustomers ?? []);

  const profileCustomer = profileId ? (allCustomers ?? []).find((c) => c._id === profileId) : null;

  const openAdd = () => {
    setEditingId(null);
    setForm({ name: "", phone: "", email: "" });
    setFormError("");
    setShowModal(true);
  };

  const openEdit = (c: typeof displayCustomers[0]) => {
    setEditingId(c._id);
    setForm({ name: c.name, phone: c.phone, email: c.email ?? "" });
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
        await updateCustomer({
          id: editingId as Id<"customers">,
          name: form.name,
          phone: form.phone,
          email: form.email || undefined,
        });
      } else {
        await createCustomer({
          name: form.name,
          phone: form.phone,
          email: form.email || undefined,
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
    <AdminLayout title="Customers">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <SearchInput placeholder="Search by name or phone..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 min-w-0" />
        <Button onClick={openAdd}><Plus size={16} /> Add Customer</Button>
      </div>

      {!allCustomers ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : displayCustomers.length === 0 ? (
        <EmptyState message="No customers found." icon={<Users size={32} strokeWidth={1.5} />} action={{ label: "Add Customer", onClick: openAdd }} />
      ) : (
        <div className="bg-white border border-[#E0E0E0] rounded-md overflow-hidden">
          <Table>
            <TableHead>
              <tr>
                <TableHeader>Name</TableHeader>
                <TableHeader>Phone</TableHeader>
                <TableHeader align="right">Total Spent</TableHeader>
                <TableHeader align="center">Visits</TableHeader>
                <TableHeader align="center">Loyalty Pts</TableHeader>
                <TableHeader align="right">Actions</TableHeader>
              </tr>
            </TableHead>
            <TableBody>
              {displayCustomers.map((c) => (
                <TableRow key={c._id} onClick={() => setProfileId(c._id)}>
                  <TableCell><span className="font-medium">{c.name}</span></TableCell>
                  <TableCell>{c.phone}</TableCell>
                  <TableCell align="right"><span className="font-mono">{formatCurrency(c.totalSpent)}</span></TableCell>
                  <TableCell align="center">{c.visitCount}</TableCell>
                  <TableCell align="center">{c.loyaltyPoints}</TableCell>
                  <TableCell align="right">
                    <button onClick={(e) => { e.stopPropagation(); openEdit(c); }} className="text-sm text-[#2563EB] hover:underline">Edit</button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? "Edit Customer" : "Add Customer"} maxWidth="sm">
        <div className="space-y-3">
          <Input label="Full Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jane Doe" autoFocus />
          <Input label="Phone Number *" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="0712 345 678" type="tel" />
          <Input label="Email (optional)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="jane@example.com" type="email" />
          {formError && <p className="text-sm text-[#DC2626]">{formError}</p>}
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleSave} loading={loading} className="flex-1">{editingId ? "Save" : "Add Customer"}</Button>
          </div>
        </div>
      </Modal>

      {/* Customer Profile */}
      <Modal isOpen={!!profileId} onClose={() => setProfileId(null)} title="Customer Profile" maxWidth="lg">
        {profileCustomer && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#F7F7F7] rounded-md p-3 text-center">
                <p className="text-sm text-[#6B6B6B]">Total Spent</p>
                <p className="text-lg font-mono font-semibold">{formatCurrency(profileCustomer.totalSpent)}</p>
              </div>
              <div className="bg-[#F7F7F7] rounded-md p-3 text-center">
                <p className="text-sm text-[#6B6B6B]">Visits</p>
                <p className="text-lg font-semibold">{profileCustomer.visitCount}</p>
              </div>
              <div className="bg-[#F7F7F7] rounded-md p-3 text-center">
                <p className="text-sm text-[#6B6B6B]">Loyalty Points</p>
                <p className="text-lg font-semibold">{profileCustomer.loyaltyPoints}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium uppercase tracking-wider text-[#6B6B6B] mb-2">Purchase History</p>
              {(customerSales ?? []).length === 0 ? (
                <p className="text-sm text-[#9B9B9B]">No purchases yet.</p>
              ) : (
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {(customerSales ?? []).map((s) => (
                    <div key={s._id} className="flex justify-between items-center py-2 border-b border-[#F0F0F0] last:border-0 text-sm">
                      <div>
                        <p className="font-mono text-sm">{s.saleNumber}</p>
                        <p className="text-sm text-[#9B9B9B]">{formatDate(s.createdAt)}</p>
                      </div>
                      <span className="font-mono font-semibold">{formatCurrency(s.grandTotal)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}
