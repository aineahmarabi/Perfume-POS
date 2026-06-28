import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { AdminLayout } from "../components/layout/AdminLayout";
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from "../components/ui/Table";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Modal } from "../components/ui/Modal";
import { Badge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
import { SkeletonTable } from "../components/ui/Skeleton";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { formatCurrency, formatDate } from "../lib/utils";
import { useAuth } from "../hooks/useAuth";
import { EXPENSE_CATEGORIES } from "../lib/constants";
import { Plus, DollarSign } from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";

type ExpenseCategory = "rent" | "utilities" | "salaries" | "supplies" | "marketing" | "maintenance" | "other";

export function ExpensesPage() {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    description: "",
    category: "other" as ExpenseCategory,
    amount: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [formError, setFormError] = useState("");

  const expenses = useQuery(api.expenses.list, {});
  const createExpense = useMutation(api.expenses.create);
  const deleteExpense = useMutation(api.expenses.remove);

  const totalThisMonth = (expenses ?? []).filter((e) => {
    const d = new Date(e.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((sum, e) => sum + e.amount, 0);

  const handleSave = async () => {
    if (!form.description.trim() || !form.amount) {
      setFormError("Description and amount are required");
      return;
    }
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) {
      setFormError("Enter a valid amount");
      return;
    }
    setLoading(true);
    setFormError("");
    try {
      await createExpense({
        description: form.description,
        category: form.category,
        amount,
        date: new Date(form.date).getTime(),
        recordedBy: user!._id,
      });
      setShowModal(false);
      setForm({ description: "", category: "other", amount: "", date: new Date().toISOString().split("T")[0] });
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Expenses">
      <div className="flex items-center justify-between mb-4">
        <div className="bg-white border border-[#E0E0E0] rounded-md px-4 py-2">
          <p className="text-sm text-[#6B6B6B]">This Month</p>
          <p className="text-lg font-mono font-semibold">{formatCurrency(totalThisMonth)}</p>
        </div>
        <Button onClick={() => setShowModal(true)}><Plus size={16} /> Add Expense</Button>
      </div>

      {!expenses ? (
        <SkeletonTable rows={6} cols={5} />
      ) : expenses.length === 0 ? (
        <EmptyState message="No expenses recorded." icon={<DollarSign size={32} strokeWidth={1.5} />} action={{ label: "Add Expense", onClick: () => setShowModal(true) }} />
      ) : (
        <div className="bg-white border border-[#E0E0E0] rounded-md overflow-hidden">
          <Table>
            <TableHead>
              <tr>
                <TableHeader>Description</TableHeader>
                <TableHeader>Category</TableHeader>
                <TableHeader align="center">Date</TableHeader>
                <TableHeader align="right">Amount</TableHeader>
                <TableHeader align="center">Actions</TableHeader>
              </tr>
            </TableHead>
            <TableBody>
              {expenses.map((e) => (
                <TableRow key={e._id}>
                  <TableCell><span className="font-medium">{e.description}</span></TableCell>
                  <TableCell>
                    <Badge variant="default">{EXPENSE_CATEGORIES.find((c) => c.value === e.category)?.label ?? e.category}</Badge>
                  </TableCell>
                  <TableCell align="center">{formatDate(e.date)}</TableCell>
                  <TableCell align="right"><span className="font-mono font-semibold">{formatCurrency(e.amount)}</span></TableCell>
                  <TableCell align="center">
                    <button onClick={() => setDeleteId(e._id)} className="text-sm text-[#DC2626] hover:underline">Delete</button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Expense" maxWidth="sm">
        <div className="space-y-3">
          <Input label="Description *" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="e.g. Monthly rent" autoFocus />
          <Select
            label="Category *"
            options={EXPENSE_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value as ExpenseCategory })}
          />
          <Input label="Amount (KES) *" type="number" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0" />
          <Input label="Date *" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          {formError && <p className="text-sm text-[#DC2626]">{formError}</p>}
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleSave} loading={loading} className="flex-1">Add Expense</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => { await deleteExpense({ id: deleteId as Id<"expenses"> }); setDeleteId(null); }}
        title="Delete Expense"
        message="This expense record will be permanently deleted."
        confirmLabel="Delete"
      />
    </AdminLayout>
  );
}

