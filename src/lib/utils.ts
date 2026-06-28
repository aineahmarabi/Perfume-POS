import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return `KSh ${amount.toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatCurrencyShort(amount: number): string {
  return `KSh ${amount.toLocaleString("en-KE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export function formatDate(timestamp: number): string {
  return format(new Date(timestamp), "dd/MM/yyyy");
}

export function formatDateTime(timestamp: number): string {
  return format(new Date(timestamp), "dd/MM/yyyy HH:mm");
}

export function formatTime(timestamp: number): string {
  return format(new Date(timestamp), "HH:mm");
}

export function formatRelative(timestamp: number): string {
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
}

export function generateSkuCode(brand: string, product: string, sizeMl: number): string {
  const brandCode = brand.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
  const productCode = product.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  return `${brandCode}-${productCode}-${sizeMl}ML`;
}

export function calculateTax(
  subtotal: number,
  taxRate: number,
  taxInclusive: boolean
): { taxAmount: number; grandTotal: number } {
  if (taxInclusive) {
    const taxAmount = subtotal - subtotal / (1 + taxRate);
    return { taxAmount, grandTotal: subtotal };
  } else {
    const taxAmount = subtotal * taxRate;
    return { taxAmount, grandTotal: subtotal + taxAmount };
  }
}

export function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength - 3)}...`;
}
