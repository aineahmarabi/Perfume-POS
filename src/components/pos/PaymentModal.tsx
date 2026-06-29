import { useState, useEffect } from "react";
import { useMutation, useAction, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { formatCurrency } from "../../lib/utils";
import type { CartItem } from "../../hooks/useCart";
import { CheckCircle, XCircle, Clock, Smartphone, CreditCard, Banknote, SplitSquareHorizontal } from "lucide-react";

type PaymentMethod = "cash" | "mpesa" | "card" | "split";

interface CartDiscount {
  type: "percent" | "flat";
  value: number;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  grandTotal: number;
  subtotal: number;
  discountTotal: number;
  taxAmount: number;
  taxRate: number;
  items: CartItem[];
  cashierId: Id<"users">;
  customerId: Id<"customers"> | null;
  saleDiscount: CartDiscount | null;
  onComplete: (saleId: string, saleNumber: string) => void;
}

export function PaymentModal({
  isOpen,
  onClose,
  grandTotal,
  subtotal,
  discountTotal,
  taxAmount,
  taxRate,
  items,
  cashierId,
  customerId,
  saleDiscount: _saleDiscount,
  onComplete,
}: PaymentModalProps) {
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Cash
  const [cashTendered, setCashTendered] = useState("");

  // M-Pesa
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [mpesaStatus, setMpesaStatus] = useState<"idle" | "processing" | "polling" | "success" | "failed">("idle");
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);
  const [mpesaRef, setMpesaRef] = useState<string>("");

  // Card
  const [cardRef, setCardRef] = useState("");
  const [cardLast4, setCardLast4] = useState("");

  // Split
  const [splitCash, setSplitCash] = useState("");
  const [splitMpesa, setSplitMpesa] = useState("");
  const [splitCard, setSplitCard] = useState("");

  const createSale = useMutation(api.sales.create);
  const initiateSTK = useAction(api.mpesa.initiateSTKPush);
  const mpesaPayment = useQuery(
    api.mpesa.getPendingPayment,
    checkoutRequestId ? { checkoutRequestId } : "skip"
  );

  // Poll M-Pesa status
  useEffect(() => {
    if (!checkoutRequestId || mpesaStatus !== "polling") return;
    if (!mpesaPayment) return;

    if (mpesaPayment.status === "completed") {
      setMpesaStatus("success");
      setMpesaRef(mpesaPayment.mpesaReceiptNumber ?? "");
    } else if (mpesaPayment.status === "failed") {
      setMpesaStatus("failed");
      setError(mpesaPayment.resultDesc ?? "M-Pesa payment failed");
    }
  }, [mpesaPayment, checkoutRequestId, mpesaStatus]);

  const change = parseFloat(cashTendered) - grandTotal;
  const splitTotal = (parseFloat(splitCash) || 0) + (parseFloat(splitMpesa) || 0) + (parseFloat(splitCard) || 0);
  const splitRemaining = grandTotal - splitTotal;

  const buildSalePayload = (paymentDetails: Record<string, unknown>) => ({
    cashierId,
    customerId: customerId ?? undefined,
    items: items.map((item) => ({
      variantId: item.variantId,
      productName: item.productName,
      brandName: item.brandName,
      sizeMl: item.sizeMl,
      sku: item.sku,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount,
      lineTotal: item.lineTotal,
    })),
    subtotal,
    discountTotal,
    taxRate,
    taxAmount,
    grandTotal,
    paymentDetails: {
      cashAmount: paymentDetails.cashAmount as number | undefined,
      cashChange: paymentDetails.cashChange as number | undefined,
      mpesaAmount: paymentDetails.mpesaAmount as number | undefined,
      mpesaRef: paymentDetails.mpesaRef as string | undefined,
      cardAmount: paymentDetails.cardAmount as number | undefined,
      cardRef: paymentDetails.cardRef as string | undefined,
      cardLast4: paymentDetails.cardLast4 as string | undefined,
    },
  });

  const handleCashComplete = async () => {
    const tendered = parseFloat(cashTendered);
    if (isNaN(tendered) || tendered < grandTotal) {
      setError("Tendered amount must be at least the total");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await createSale({
        ...buildSalePayload({
          cashAmount: tendered,
          cashChange: tendered - grandTotal,
        }),
        paymentMethod: "cash",
      });
      onComplete(result.saleId, result.saleNumber);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Sale failed");
    } finally {
      setLoading(false);
    }
  };

  const handleMpesaSend = async () => {
    if (!mpesaPhone || mpesaPhone.length < 9) {
      setError("Enter a valid phone number");
      return;
    }
    setLoading(true);
    setError("");
    setMpesaStatus("processing");
    try {
      const tempRef = `TMP-${Date.now()}`;
      const result = await initiateSTK({
        phone: mpesaPhone,
        amount: grandTotal,
        saleReference: tempRef,
      });
      if (result.success && result.checkoutRequestId) {
        setCheckoutRequestId(result.checkoutRequestId);
        setMpesaStatus("polling");
      } else {
        setMpesaStatus("failed");
        setError(result.error ?? "STK push failed");
      }
    } catch (e: unknown) {
      setMpesaStatus("failed");
      setError(e instanceof Error ? e.message : "Failed to initiate M-Pesa payment");
    } finally {
      setLoading(false);
    }
  };

  const handleMpesaComplete = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await createSale({
        ...buildSalePayload({
          mpesaAmount: grandTotal,
          mpesaRef,
        }),
        paymentMethod: "mpesa",
      });
      onComplete(result.saleId, result.saleNumber);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Sale failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCardComplete = async () => {
    if (!cardRef.trim()) {
      setError("Enter card reference or last 4 digits");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await createSale({
        ...buildSalePayload({
          cardAmount: grandTotal,
          cardRef: cardRef.trim(),
          cardLast4: cardLast4.trim() || undefined,
        }),
        paymentMethod: "card",
      });
      onComplete(result.saleId, result.saleNumber);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Sale failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSplitComplete = async () => {
    if (Math.abs(splitRemaining) > 1) {
      setError("Total split amounts must equal the grand total");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await createSale({
        ...buildSalePayload({
          cashAmount: parseFloat(splitCash) || undefined,
          mpesaAmount: parseFloat(splitMpesa) || undefined,
          cardAmount: parseFloat(splitCard) || undefined,
        }),
        paymentMethod: "split",
      });
      onComplete(result.saleId, result.saleNumber);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Sale failed");
    } finally {
      setLoading(false);
    }
  };

  const tabs: { key: PaymentMethod; label: string; icon: typeof Banknote }[] = [
    { key: "cash", label: "Cash", icon: Banknote },
    { key: "mpesa", label: "M-Pesa", icon: Smartphone },
    { key: "card", label: "Card", icon: CreditCard },
    { key: "split", label: "Split", icon: SplitSquareHorizontal },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Payment — ${formatCurrency(grandTotal)}`} maxWidth="md">
      {/* Tabs */}
      <div className="flex border-b border-[#E0E0E0] mb-4 -mx-6 px-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setMethod(tab.key); setError(""); setMpesaStatus("idle"); }}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              method === tab.key
                ? "border-[#685b8a] text-[#685b8a]"
                : "border-transparent text-[#6B6B6B] hover:text-[#685b8a]"
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-[#DC2626]">
          {error}
        </div>
      )}

      {/* Cash */}
      {method === "cash" && (
        <div className="space-y-4">
          <div className="bg-[#F7F7F7] rounded-md p-4 text-center">
            <p className="text-sm text-[#6B6B6B] mb-1">Amount Due</p>
            <p className="text-3xl font-semibold font-mono tabular-nums">{formatCurrency(grandTotal)}</p>
          </div>
          <Input
            label="Cash Tendered (KSh)"
            type="number"
            min={grandTotal}
            step="50"
            value={cashTendered}
            onChange={(e) => setCashTendered(e.target.value)}
            placeholder={grandTotal.toString()}
            autoFocus
          />
          {parseFloat(cashTendered) >= grandTotal && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4 text-center">
              <p className="text-sm text-green-600 mb-1">Change Due</p>
              <p className="text-2xl font-semibold font-mono tabular-nums text-green-700">
                {formatCurrency(change)}
              </p>
            </div>
          )}
          <Button
            onClick={handleCashComplete}
            loading={loading}
            className="w-full h-12 text-sm"
            disabled={!cashTendered || parseFloat(cashTendered) < grandTotal}
          >
            Complete Sale
          </Button>
        </div>
      )}

      {/* M-Pesa */}
      {method === "mpesa" && (
        <div className="space-y-4">
          <div className="bg-[#F7F7F7] rounded-md p-4 text-center">
            <p className="text-sm text-[#6B6B6B] mb-1">Amount to Charge</p>
            <p className="text-3xl font-semibold font-mono tabular-nums">{formatCurrency(grandTotal)}</p>
          </div>

          {mpesaStatus === "idle" && (
            <>
              <Input
                label="Customer Phone Number"
                placeholder="0712 345 678 or 254712345678"
                value={mpesaPhone}
                onChange={(e) => setMpesaPhone(e.target.value)}
                type="tel"
                autoFocus
              />
              <Button onClick={handleMpesaSend} loading={loading} className="w-full h-12 text-sm">
                Send STK Push
              </Button>
            </>
          )}

          {(mpesaStatus === "processing" || mpesaStatus === "polling") && (
            <div className="text-center py-6 space-y-3">
              <div className="flex justify-center">
                <Clock size={40} className="text-[#2563EB] animate-pulse" />
              </div>
              <p className="text-sm font-medium text-[#685b8a]">Waiting for M-Pesa confirmation...</p>
              <p className="text-sm text-[#6B6B6B]">Ask customer to enter their M-Pesa PIN</p>
              <p className="text-sm text-[#9B9B9B]">Phone: {mpesaPhone}</p>
            </div>
          )}

          {mpesaStatus === "success" && (
            <div className="space-y-4">
              <div className="text-center py-4 space-y-2">
                <CheckCircle size={40} className="text-[#16A34A] mx-auto" />
                <p className="text-sm font-medium text-[#685b8a]">M-Pesa payment confirmed!</p>
                <p className="text-sm text-[#6B6B6B] font-mono">{mpesaRef}</p>
              </div>
              <Button onClick={handleMpesaComplete} loading={loading} className="w-full h-12 text-sm">
                Complete Sale
              </Button>
            </div>
          )}

          {mpesaStatus === "failed" && (
            <div className="space-y-4">
              <div className="text-center py-4 space-y-2">
                <XCircle size={40} className="text-[#DC2626] mx-auto" />
                <p className="text-sm font-medium text-[#685b8a]">Payment failed</p>
                <p className="text-sm text-[#6B6B6B]">Ask customer to check their M-Pesa and try again</p>
              </div>
              <Button onClick={() => { setMpesaStatus("idle"); setError(""); }} variant="secondary" className="w-full">
                Try Again
              </Button>
            </div>
          )}

          {/* Manual entry fallback */}
          {(mpesaStatus === "idle" || mpesaStatus === "success") && (
            <div className="border-t border-[#E0E0E0] pt-3">
              <p className="text-sm text-[#9B9B9B] mb-2">Or enter M-Pesa code manually:</p>
              <div className="flex gap-2">
                <Input
                  placeholder="M-Pesa transaction code"
                  value={mpesaRef}
                  onChange={(e) => setMpesaRef(e.target.value)}
                />
                {mpesaRef && (
                  <Button onClick={handleMpesaComplete} loading={loading} size="sm">
                    Complete
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Card */}
      {method === "card" && (
        <div className="space-y-4">
          <div className="bg-[#F7F7F7] rounded-md p-4 text-center">
            <p className="text-sm text-[#6B6B6B] mb-1">Amount to Charge</p>
            <p className="text-3xl font-semibold font-mono tabular-nums">{formatCurrency(grandTotal)}</p>
          </div>
          <Input
            label="Card Reference / Transaction ID"
            placeholder="From card terminal receipt"
            value={cardRef}
            onChange={(e) => setCardRef(e.target.value)}
            autoFocus
          />
          <Input
            label="Last 4 Digits (optional)"
            placeholder="1234"
            value={cardLast4}
            onChange={(e) => setCardLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
            maxLength={4}
          />
          <Button
            onClick={handleCardComplete}
            loading={loading}
            className="w-full h-12 text-sm"
            disabled={!cardRef.trim()}
          >
            Complete Sale
          </Button>
        </div>
      )}

      {/* Split */}
      {method === "split" && (
        <div className="space-y-4">
          <div className="bg-[#F7F7F7] rounded-md p-4 text-center">
            <p className="text-sm text-[#6B6B6B] mb-1">Total Amount</p>
            <p className="text-3xl font-semibold font-mono tabular-nums">{formatCurrency(grandTotal)}</p>
          </div>
          <div className="space-y-3">
            <Input
              label="Cash Amount (KSh)"
              type="number"
              min="0"
              value={splitCash}
              onChange={(e) => setSplitCash(e.target.value)}
              placeholder="0"
            />
            <Input
              label="M-Pesa Amount (KSh)"
              type="number"
              min="0"
              value={splitMpesa}
              onChange={(e) => setSplitMpesa(e.target.value)}
              placeholder="0"
            />
            <Input
              label="Card Amount (KSh)"
              type="number"
              min="0"
              value={splitCard}
              onChange={(e) => setSplitCard(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className={`p-3 rounded-md text-sm font-medium flex justify-between ${
            Math.abs(splitRemaining) <= 1 ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
          }`}>
            <span>Remaining</span>
            <span className="font-mono">{formatCurrency(Math.max(0, splitRemaining))}</span>
          </div>
          <Button
            onClick={handleSplitComplete}
            loading={loading}
            className="w-full h-12 text-sm"
            disabled={Math.abs(splitRemaining) > 1}
          >
            Complete Sale
          </Button>
        </div>
      )}
    </Modal>
  );
}
