import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { useDebounce } from "../../hooks/useDebounce";

interface CustomerLookupProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (id: Id<"customers">, name: string) => void;
}

export function CustomerLookup({ isOpen, onClose, onSelect }: CustomerLookupProps) {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [addError, setAddError] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  const debouncedSearch = useDebounce(search, 200);
  const byPhone = useQuery(api.customers.searchByPhone, { phone: debouncedSearch });
  const byName = useQuery(api.customers.searchByName, { name: debouncedSearch });
  const createCustomer = useMutation(api.customers.create);

  const results = debouncedSearch.length >= 2
    ? [...(byPhone ?? []), ...(byName ?? [])].filter(
        (c, i, arr) => arr.findIndex((x) => x._id === c._id) === i
      )
    : [];

  const handleAdd = async () => {
    if (!newName.trim() || !newPhone.trim()) {
      setAddError("Name and phone are required");
      return;
    }
    setAddLoading(true);
    setAddError("");
    try {
      const id = await createCustomer({ name: newName.trim(), phone: newPhone.trim() });
      onSelect(id as Id<"customers">, newName.trim());
    } catch (e: unknown) {
      setAddError(e instanceof Error ? e.message : "Failed to add customer");
    } finally {
      setAddLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Attach Customer" maxWidth="sm">
      {!showAdd ? (
        <div className="space-y-3">
          <Input
            placeholder="Search by phone or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {results.map((c) => (
              <button
                key={c._id}
                onClick={() => onSelect(c._id as Id<"customers">, c.name)}
                className="w-full text-left px-3 py-2.5 rounded-md hover:bg-[#F7F7F7] border border-[#E0E0E0] transition-colors"
              >
                <p className="text-sm font-medium text-[#3432a8]">{c.name}</p>
                <p className="text-sm text-[#6B6B6B]">{c.phone} · {c.loyaltyPoints} pts</p>
              </button>
            ))}
            {debouncedSearch.length >= 2 && results.length === 0 && (
              <p className="text-sm text-[#9B9B9B] text-center py-4">No customers found.</p>
            )}
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
            <Button variant="primary" onClick={() => setShowAdd(true)} className="flex-1">
              + New Customer
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <Input
            label="Full Name"
            placeholder="Customer name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            autoFocus
          />
          <Input
            label="Phone Number"
            placeholder="0712 345 678"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            type="tel"
          />
          {addError && <p className="text-sm text-[#DC2626]">{addError}</p>}
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowAdd(false)} className="flex-1">
              Back
            </Button>
            <Button onClick={handleAdd} loading={addLoading} className="flex-1">
              Add Customer
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
