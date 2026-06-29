import { useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { formatCurrency } from "../../lib/utils";

interface CartDiscount {
  type: "percent" | "flat";
  value: number;
}

interface DiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDiscount: CartDiscount | null;
  subtotal: number;
  onApply: (discount: CartDiscount | null) => void;
  isAdmin: boolean;
}

export function DiscountModal({
  isOpen,
  onClose,
  currentDiscount,
  subtotal,
  onApply,
  isAdmin,
}: DiscountModalProps) {
  const [type, setType] = useState<"percent" | "flat">(currentDiscount?.type ?? "percent");
  const [value, setValue] = useState(currentDiscount?.value?.toString() ?? "");
  const [error, setError] = useState("");

  const MAX_PERCENT = isAdmin ? 50 : 20;

  const handleApply = () => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) {
      setError("Enter a valid discount amount");
      return;
    }
    if (type === "percent" && numValue > MAX_PERCENT) {
      setError(`Maximum discount is ${MAX_PERCENT}%${!isAdmin ? " for cashiers" : ""}`);
      return;
    }
    if (type === "flat" && numValue >= subtotal) {
      setError("Discount cannot exceed or equal the subtotal");
      return;
    }
    onApply({ type, value: numValue });
  };

  const previewAmount = (() => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) return 0;
    return type === "percent" ? subtotal * (numValue / 100) : numValue;
  })();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Apply Discount" maxWidth="sm">
      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            onClick={() => setType("percent")}
            className={`flex-1 h-10 rounded-md border text-sm font-medium transition-colors ${
              type === "percent"
                ? "bg-[#8B5A2B] text-white border-[#8B5A2B]"
                : "bg-white text-[#6B6B6B] border-[#E0E0E0] hover:bg-[#F7F7F7]"
            }`}
          >
            Percentage (%)
          </button>
          <button
            onClick={() => setType("flat")}
            className={`flex-1 h-10 rounded-md border text-sm font-medium transition-colors ${
              type === "flat"
                ? "bg-[#8B5A2B] text-white border-[#8B5A2B]"
                : "bg-white text-[#6B6B6B] border-[#E0E0E0] hover:bg-[#F7F7F7]"
            }`}
          >
            Fixed Amount (KSh)
          </button>
        </div>

        <Input
          label={type === "percent" ? `Discount Percentage (max ${MAX_PERCENT}%)` : "Discount Amount (KSh)"}
          type="number"
          min="0"
          max={type === "percent" ? MAX_PERCENT : subtotal - 1}
          value={value}
          onChange={(e) => { setValue(e.target.value); setError(""); }}
          placeholder={type === "percent" ? "e.g. 10" : "e.g. 500"}
          autoFocus
          error={error}
        />

        {parseFloat(value) > 0 && !isNaN(parseFloat(value)) && (
          <div className="bg-[#F7F7F7] rounded-md p-3 text-sm">
            <div className="flex justify-between text-[#6B6B6B]">
              <span>Subtotal</span>
              <span className="font-mono">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-[#16A34A] font-medium mt-1">
              <span>Discount</span>
              <span className="font-mono">-{formatCurrency(previewAmount)}</span>
            </div>
            <div className="flex justify-between text-[#8B5A2B] font-semibold mt-1 pt-1 border-t border-[#E0E0E0]">
              <span>After Discount</span>
              <span className="font-mono">{formatCurrency(subtotal - previewAmount)}</span>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          {currentDiscount && (
            <Button variant="ghost" onClick={() => onApply(null)} className="flex-1">
              Remove
            </Button>
          )}
          <Button onClick={handleApply} className="flex-1">Apply</Button>
        </div>
      </div>
    </Modal>
  );
}
