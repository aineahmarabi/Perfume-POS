import { useState, useCallback, useMemo } from "react";
import type { Id } from "../../convex/_generated/dataModel";

export interface CartItem {
  variantId: Id<"productVariants">;
  productId: Id<"products">;
  productName: string;
  brandName: string;
  sizeMl: number;
  sku: string;
  unitPrice: number;
  quantity: number;
  discount: number;
  lineTotal: number;
  maxStock: number;
}

export interface CartDiscount {
  type: "percent" | "flat";
  value: number;
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [saleDiscount, setSaleDiscount] = useState<CartDiscount | null>(null);
  const [customerId, setCustomerId] = useState<Id<"customers"> | null>(null);

  const addItem = useCallback(
    (item: Omit<CartItem, "quantity" | "discount" | "lineTotal">) => {
      setItems((prev) => {
        const existing = prev.find((i) => i.variantId === item.variantId);
        if (existing) {
          if (existing.quantity >= existing.maxStock) return prev;
          return prev.map((i) =>
            i.variantId === item.variantId
              ? {
                  ...i,
                  quantity: i.quantity + 1,
                  lineTotal: (i.quantity + 1) * i.unitPrice - i.discount,
                }
              : i
          );
        }
        return [
          ...prev,
          {
            ...item,
            quantity: 1,
            discount: 0,
            lineTotal: item.unitPrice,
          },
        ];
      });
    },
    []
  );

  const removeItem = useCallback((variantId: Id<"productVariants">) => {
    setItems((prev) => prev.filter((i) => i.variantId !== variantId));
  }, []);

  const updateQuantity = useCallback(
    (variantId: Id<"productVariants">, quantity: number) => {
      if (quantity <= 0) {
        setItems((prev) => prev.filter((i) => i.variantId !== variantId));
        return;
      }
      setItems((prev) =>
        prev.map((i) =>
          i.variantId === variantId
            ? {
                ...i,
                quantity: Math.min(quantity, i.maxStock),
                lineTotal: Math.min(quantity, i.maxStock) * i.unitPrice - i.discount,
              }
            : i
        )
      );
    },
    []
  );

  const updateItemDiscount = useCallback(
    (variantId: Id<"productVariants">, discount: number) => {
      setItems((prev) =>
        prev.map((i) =>
          i.variantId === variantId
            ? {
                ...i,
                discount,
                lineTotal: Math.max(0, i.quantity * i.unitPrice - discount),
              }
            : i
        )
      );
    },
    []
  );

  const clearCart = useCallback(() => {
    setItems([]);
    setSaleDiscount(null);
    setCustomerId(null);
  }, []);

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
    const itemDiscounts = items.reduce((sum, i) => sum + i.discount, 0);

    let saleDiscountAmount = 0;
    if (saleDiscount) {
      if (saleDiscount.type === "percent") {
        saleDiscountAmount = subtotal * (saleDiscount.value / 100);
      } else {
        saleDiscountAmount = saleDiscount.value;
      }
    }
    saleDiscountAmount = Math.min(saleDiscountAmount, subtotal);

    const discountedSubtotal = subtotal - saleDiscountAmount;
    const discountTotal = itemDiscounts + saleDiscountAmount;

    // Tax inclusive - VAT is included in the price
    const TAX_RATE = 0.16;
    const taxAmount = discountedSubtotal - discountedSubtotal / (1 + TAX_RATE);
    const grandTotal = discountedSubtotal;

    return {
      subtotal,
      saleDiscountAmount,
      discountTotal,
      taxAmount,
      grandTotal,
    };
  }, [items, saleDiscount]);

  return {
    items,
    saleDiscount,
    customerId,
    addItem,
    removeItem,
    updateQuantity,
    updateItemDiscount,
    setSaleDiscount,
    setCustomerId,
    clearCart,
    totals,
    isEmpty: items.length === 0,
    itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
  };
}
