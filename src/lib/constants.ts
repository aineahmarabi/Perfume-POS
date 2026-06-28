export const TAX_RATE = 0.16;
export const TAX_INCLUSIVE = true;
export const MAX_DISCOUNT_PERCENT = 50;
export const MAX_ADMIN_FREE_DISCOUNT_PERCENT = 20;
export const MAX_HELD_SALES = 10;
export const LOW_STOCK_DEFAULT = 5;
export const LOYALTY_POINTS_RATE = 100;
export const SESSION_DURATION_HOURS = 8;

export const EXPENSE_CATEGORIES = [
  { value: "rent", label: "Rent" },
  { value: "utilities", label: "Utilities" },
  { value: "salaries", label: "Salaries" },
  { value: "supplies", label: "Supplies" },
  { value: "marketing", label: "Marketing" },
  { value: "maintenance", label: "Maintenance" },
  { value: "other", label: "Other" },
] as const;

export const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "mpesa", label: "M-Pesa" },
  { value: "card", label: "Card" },
  { value: "split", label: "Split" },
] as const;

export const SALE_STATUSES = [
  { value: "completed", label: "Completed" },
  { value: "voided", label: "Voided" },
  { value: "refunded", label: "Refunded" },
  { value: "on_hold", label: "On Hold" },
] as const;

export const PO_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "ordered", label: "Ordered" },
  { value: "received", label: "Received" },
  { value: "partial", label: "Partial" },
  { value: "cancelled", label: "Cancelled" },
] as const;

export const STOCK_ADJUSTMENT_REASONS = [
  { value: "count_correction", label: "Stock Count Correction" },
  { value: "damage", label: "Damaged Stock" },
  { value: "expiry", label: "Expired Stock Write-off" },
  { value: "theft", label: "Theft/Shrinkage" },
  { value: "other", label: "Other" },
] as const;
