import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { AdminLayout } from "../components/layout/AdminLayout";
import { Tabs, TabList, Tab, TabPanel } from "../components/ui/Tabs";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Modal } from "../components/ui/Modal";
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from "../components/ui/Table";
import { StatusBadge } from "../components/ui/Badge";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { SkeletonForm, SkeletonTable } from "../components/ui/Skeleton";

export function SettingsPage() {
  return (
    <AdminLayout title="Settings">
      <Tabs defaultTab="general">
        <TabList className="mb-6">
          <Tab value="general">General</Tab>
          <Tab value="receipt">Receipt</Tab>
          <Tab value="payments">Payments</Tab>
          <Tab value="catalogue">Brands & Categories</Tab>
          <Tab value="users">Users</Tab>
        </TabList>
        <TabPanel value="general"><GeneralSettings /></TabPanel>
        <TabPanel value="receipt"><ReceiptSettings /></TabPanel>
        <TabPanel value="payments"><PaymentSettings /></TabPanel>
        <TabPanel value="catalogue"><CatalogueSettings /></TabPanel>
        <TabPanel value="users"><UserManagement /></TabPanel>
      </Tabs>
    </AdminLayout>
  );
}

function GeneralSettings() {
  const settings = useQuery(api.settings.getAll);
  const setMultiple = useMutation(api.settings.setMultiple);
  const [form, setForm] = useState({ shop_name: "", shop_phone: "", shop_address: "", tax_rate: "0.16", tax_inclusive: "true", low_stock_default: "5" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({
        shop_name: settings["shop_name"] ?? "",
        shop_phone: settings["shop_phone"] ?? "",
        shop_address: settings["shop_address"] ?? "",
        tax_rate: settings["tax_rate"] ?? "0.16",
        tax_inclusive: settings["tax_inclusive"] ?? "true",
        low_stock_default: settings["low_stock_default"] ?? "5",
      });
    }
  }, [settings]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await setMultiple({ settings: Object.entries(form).map(([key, value]) => ({ key, value })) });
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  if (!settings) return <SkeletonForm fields={6} />;

  return (
    <div className="max-w-lg space-y-4">
      <Input label="Shop Name" value={form.shop_name} onChange={(e) => setForm({ ...form, shop_name: e.target.value })} />
      <Input label="Shop Phone" value={form.shop_phone} onChange={(e) => setForm({ ...form, shop_phone: e.target.value })} type="tel" />
      <Input label="Shop Address" value={form.shop_address} onChange={(e) => setForm({ ...form, shop_address: e.target.value })} />
      <Input label="Tax Rate (e.g. 0.16 for 16%)" value={form.tax_rate} onChange={(e) => setForm({ ...form, tax_rate: e.target.value })} type="number" step="0.01" min="0" max="1" />
      <Select
        label="Tax Inclusive (prices include VAT)"
        options={[{ value: "true", label: "Yes — prices include VAT" }, { value: "false", label: "No — VAT added on top" }]}
        value={form.tax_inclusive}
        onChange={(e) => setForm({ ...form, tax_inclusive: e.target.value })}
      />
      <Input label="Default Low Stock Threshold" value={form.low_stock_default} onChange={(e) => setForm({ ...form, low_stock_default: e.target.value })} type="number" min="1" />
      <Button onClick={handleSave} loading={loading}>Save Settings</Button>
    </div>
  );
}

function ReceiptSettings() {
  const settings = useQuery(api.settings.getAll);
  const setMultiple = useMutation(api.settings.setMultiple);
  const [form, setForm] = useState({ receipt_footer: "", receipt_show_logo: "true" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({
        receipt_footer: settings["receipt_footer"] ?? "Thank you for shopping with us!",
        receipt_show_logo: settings["receipt_show_logo"] ?? "true",
      });
    }
  }, [settings]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await setMultiple({ settings: Object.entries(form).map(([key, value]) => ({ key, value })) });
      toast.success("Receipt settings saved");
    } catch {
      toast.error("Failed to save");
    } finally {
      setLoading(false);
    }
  };

  if (!settings) return <SkeletonForm fields={2} />;

  return (
    <div className="max-w-lg space-y-4">
      <Input label="Receipt Footer Message" value={form.receipt_footer} onChange={(e) => setForm({ ...form, receipt_footer: e.target.value })} />
      <Select
        label="Show Logo on Receipt"
        options={[{ value: "true", label: "Yes" }, { value: "false", label: "No" }]}
        value={form.receipt_show_logo}
        onChange={(e) => setForm({ ...form, receipt_show_logo: e.target.value })}
      />
      <Button onClick={handleSave} loading={loading}>Save Receipt Settings</Button>
    </div>
  );
}

function PaymentSettings() {
  const settings = useQuery(api.settings.getAll);
  const setMultiple = useMutation(api.settings.setMultiple);
  const [form, setForm] = useState({ mpesa_shortcode: "", mpesa_passkey: "", mpesa_consumer_key: "", mpesa_consumer_secret: "", mpesa_environment: "sandbox" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({
        mpesa_shortcode: settings["mpesa_shortcode"] ?? "",
        mpesa_passkey: settings["mpesa_passkey"] ?? "",
        mpesa_consumer_key: settings["mpesa_consumer_key"] ?? "",
        mpesa_consumer_secret: settings["mpesa_consumer_secret"] ?? "",
        mpesa_environment: settings["mpesa_environment"] ?? "sandbox",
      });
    }
  }, [settings]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await setMultiple({ settings: Object.entries(form).map(([key, value]) => ({ key, value })) });
      toast.success("Payment settings saved");
    } catch {
      toast.error("Failed to save");
    } finally {
      setLoading(false);
    }
  };

  if (!settings) return <SkeletonForm fields={5} />;

  return (
    <div className="max-w-lg space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-700">
        M-Pesa credentials are stored securely and used only for STK push requests.
      </div>
      <Select
        label="Environment"
        options={[{ value: "sandbox", label: "Sandbox (Testing)" }, { value: "production", label: "Production (Live)" }]}
        value={form.mpesa_environment}
        onChange={(e) => setForm({ ...form, mpesa_environment: e.target.value })}
      />
      <Input label="Business Short Code" value={form.mpesa_shortcode} onChange={(e) => setForm({ ...form, mpesa_shortcode: e.target.value })} placeholder="174379" />
      <Input label="Passkey" value={form.mpesa_passkey} onChange={(e) => setForm({ ...form, mpesa_passkey: e.target.value })} type="password" />
      <Input label="Consumer Key" value={form.mpesa_consumer_key} onChange={(e) => setForm({ ...form, mpesa_consumer_key: e.target.value })} />
      <Input label="Consumer Secret" value={form.mpesa_consumer_secret} onChange={(e) => setForm({ ...form, mpesa_consumer_secret: e.target.value })} type="password" />
      <Button onClick={handleSave} loading={loading}>Save Payment Settings</Button>
    </div>
  );
}

function UserManagement() {
  const [showModal, setShowModal] = useState(false);
  const [showPinReset, setShowPinReset] = useState<string | null>(null);
  const [newPin, setNewPin] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", role: "cashier", pin: "" });
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  const users = useQuery(api.users.list);
  const createUser = useMutation(api.users.create);
  const toggleActive = useMutation(api.users.toggleActive);
  const resetPin = useMutation(api.users.resetPin);

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.pin || form.pin.length !== 4) {
      setFormError("All fields are required. PIN must be 4 digits.");
      return;
    }
    setLoading(true);
    setFormError("");
    try {
      await createUser({
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        role: form.role as "admin" | "cashier",
        pin: form.pin,
      });
      setShowModal(false);
      setForm({ name: "", email: "", phone: "", role: "cashier", pin: "" });
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  const handlePinReset = async () => {
    if (!showPinReset || newPin.length !== 4) return;
    setLoading(true);
    try {
      await resetPin({ id: showPinReset as Id<"users">, newPin });
      setShowPinReset(null);
      setNewPin("");
      toast.success("PIN reset successfully");
    } catch {
      toast.error("Failed to reset PIN");
    } finally {
      setLoading(false);
    }
  };

  if (!users) return <SkeletonTable rows={4} cols={5} />;

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setShowModal(true)}><Plus size={16} /> Add Staff Member</Button>
      </div>
      <div className="bg-white border border-[#E0E0E0] rounded-md overflow-hidden">
        <Table>
          <TableHead>
            <tr>
              <TableHeader>Name</TableHeader>
              <TableHeader>Email</TableHeader>
              <TableHeader align="center">Role</TableHeader>
              <TableHeader align="center">Status</TableHeader>
              <TableHeader align="center">Actions</TableHeader>
            </tr>
          </TableHead>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u._id}>
                <TableCell><span className="font-medium">{u.name}</span></TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell align="center"><span className="capitalize">{u.role}</span></TableCell>
                <TableCell align="center"><StatusBadge status={u.isActive ? "active" : "inactive"} /></TableCell>
                <TableCell align="center">
                  <div className="flex items-center justify-center gap-3">
                    <button onClick={() => { setShowPinReset(u._id); setNewPin(""); }} className="text-sm text-[#2563EB] hover:underline flex items-center gap-1">
                      <RefreshCw size={11} /> Reset PIN
                    </button>
                    <button
                      onClick={() => toggleActive({ id: u._id as Id<"users">, isActive: !u.isActive })}
                      className={`text-sm hover:underline ${u.isActive ? "text-[#DC2626]" : "text-[#16A34A]"}`}
                    >
                      {u.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Staff Member" maxWidth="sm">
        <div className="space-y-3">
          <Input label="Full Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
          <Input label="Email *" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" />
          <Input label="Phone (optional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} type="tel" />
          <Select label="Role *" options={[{ value: "cashier", label: "Cashier" }, { value: "admin", label: "Admin" }]} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
          <Input label="4-Digit PIN *" value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, "").slice(0, 4) })} type="password" placeholder="••••" maxLength={4} />
          {formError && <p className="text-sm text-[#DC2626]">{formError}</p>}
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleCreate} loading={loading} className="flex-1">Add Staff</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!showPinReset} onClose={() => setShowPinReset(null)} title="Reset PIN" maxWidth="sm">
        <div className="space-y-3">
          <Input label="New 4-Digit PIN" value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))} type="password" placeholder="••••" maxLength={4} autoFocus />
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowPinReset(null)} className="flex-1">Cancel</Button>
            <Button onClick={handlePinReset} loading={loading} disabled={newPin.length !== 4} className="flex-1">Reset PIN</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function CatalogueSettings() {
  const brands = useQuery(api.brands.list, { activeOnly: false });
  const categories = useQuery(api.categories.list, { activeOnly: false });
  const createBrand = useMutation(api.brands.create);
  const updateBrand = useMutation(api.brands.update);
  const createCategory = useMutation(api.categories.create);
  const updateCategory = useMutation(api.categories.update);

  const [newBrand, setNewBrand] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [addingBrand, setAddingBrand] = useState(false);
  const [addingCategory, setAddingCategory] = useState(false);

  const handleAddBrand = async () => {
    if (!newBrand.trim()) return;
    setAddingBrand(true);
    try { await createBrand({ name: newBrand.trim() }); setNewBrand(""); toast.success("Brand added"); }
    catch { toast.error("Failed to add brand"); }
    finally { setAddingBrand(false); }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    setAddingCategory(true);
    try { await createCategory({ name: newCategory.trim() }); setNewCategory(""); toast.success("Category added"); }
    catch { toast.error("Failed to add category"); }
    finally { setAddingCategory(false); }
  };

  const toggleBrand = async (b: NonNullable<typeof brands>[0]) => {
    await updateBrand({ id: b._id as Id<"brands">, name: b.name, isActive: !b.isActive });
    toast.success(b.isActive ? "Brand deactivated" : "Brand activated");
  };

  const toggleCategory = async (c: NonNullable<typeof categories>[0]) => {
    await updateCategory({ id: c._id as Id<"categories">, name: c.name, isActive: !c.isActive });
    toast.success(c.isActive ? "Category deactivated" : "Category activated");
  };

  if (!brands || !categories) return <SkeletonTable rows={5} cols={3} />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Brands */}
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-[#6B6B6B] mb-3">Brands</p>
        <div className="flex gap-2 mb-3">
          <input
            value={newBrand}
            onChange={(e) => setNewBrand(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddBrand()}
            placeholder="New brand name..."
            className="input-base flex-1"
          />
          <Button onClick={handleAddBrand} loading={addingBrand} disabled={!newBrand.trim()}>
            <Plus size={14} /> Add
          </Button>
        </div>
        <div className="bg-white border border-[#E0E0E0] rounded-md overflow-hidden">
          {brands.length === 0 ? (
            <p className="text-sm text-[#9B9B9B] p-4">No brands yet.</p>
          ) : (
            brands.map((b) => (
              <div key={b._id} className="flex items-center justify-between px-4 py-2.5 border-b border-[#F0F0F0] last:border-0">
                <span className={`text-sm font-medium ${b.isActive ? "text-[#6B1A2A]" : "text-[#9B9B9B] line-through"}`}>{b.name}</span>
                <button
                  onClick={() => toggleBrand(b)}
                  className={`flex items-center gap-1 text-sm px-2 py-1 rounded transition-colors ${b.isActive ? "text-[#DC2626] hover:bg-red-50" : "text-[#16A34A] hover:bg-green-50"}`}
                >
                  {b.isActive ? <><Trash2 size={12} /> Delete</> : "Restore"}
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Categories */}
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-[#6B6B6B] mb-3">Categories</p>
        <div className="flex gap-2 mb-3">
          <input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
            placeholder="New category name..."
            className="input-base flex-1"
          />
          <Button onClick={handleAddCategory} loading={addingCategory} disabled={!newCategory.trim()}>
            <Plus size={14} /> Add
          </Button>
        </div>
        <div className="bg-white border border-[#E0E0E0] rounded-md overflow-hidden">
          {categories.length === 0 ? (
            <p className="text-sm text-[#9B9B9B] p-4">No categories yet.</p>
          ) : (
            categories.map((c) => (
              <div key={c._id} className="flex items-center justify-between px-4 py-2.5 border-b border-[#F0F0F0] last:border-0">
                <span className={`text-sm font-medium ${c.isActive ? "text-[#6B1A2A]" : "text-[#9B9B9B] line-through"}`}>{c.name}</span>
                <button
                  onClick={() => toggleCategory(c)}
                  className={`flex items-center gap-1 text-sm px-2 py-1 rounded transition-colors ${c.isActive ? "text-[#DC2626] hover:bg-red-50" : "text-[#16A34A] hover:bg-green-50"}`}
                >
                  {c.isActive ? <><Trash2 size={12} /> Delete</> : "Restore"}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
