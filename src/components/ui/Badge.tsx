import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

type BadgeVariant = "success" | "warning" | "danger" | "info" | "default" | "pending";

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  success: "bg-green-50 text-green-700 border border-green-200",
  warning: "bg-amber-50 text-amber-700 border border-amber-200",
  danger: "bg-red-50 text-red-700 border border-red-200",
  info: "bg-blue-50 text-blue-700 border border-blue-200",
  default: "bg-[#F0F0F0] text-[#6B6B6B] border border-[#E0E0E0]",
  pending: "bg-blue-50 text-blue-700 border border-blue-200",
};

export function Badge({ variant = "default", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-sm font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function StockBadge({ quantity, threshold }: { quantity: number; threshold: number }) {
  if (quantity <= 0) return <Badge variant="danger">Out of Stock</Badge>;
  if (quantity <= threshold) return <Badge variant="warning">Low Stock</Badge>;
  return <Badge variant="success">In Stock</Badge>;
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: BadgeVariant; label: string }> = {
    completed: { variant: "success", label: "Completed" },
    voided: { variant: "danger", label: "Voided" },
    refunded: { variant: "warning", label: "Refunded" },
    on_hold: { variant: "info", label: "On Hold" },
    draft: { variant: "default", label: "Draft" },
    ordered: { variant: "info", label: "Ordered" },
    received: { variant: "success", label: "Received" },
    partial: { variant: "warning", label: "Partial" },
    cancelled: { variant: "danger", label: "Cancelled" },
    active: { variant: "success", label: "Active" },
    inactive: { variant: "default", label: "Inactive" },
  };

  const config = map[status] ?? { variant: "default" as BadgeVariant, label: status };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
