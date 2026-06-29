import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { formatDate, formatTime, formatCurrency } from "../../lib/utils";
import { Printer, ShoppingCart } from "lucide-react";

interface ReceiptModalProps {
  isOpen: boolean;
  saleId: string | null;
  onNewSale: () => void;
}

export function ReceiptModal({ isOpen, saleId, onNewSale }: ReceiptModalProps) {
  const sale = useQuery(
    api.sales.get,
    saleId ? { id: saleId as Id<"sales"> } : "skip"
  );
  const settings = useQuery(api.settings.getAll);

  const shopName = settings?.["shop_name"] ?? "Perfume Shop";
  const shopPhone = settings?.["shop_phone"] ?? "";
  const shopAddress = settings?.["shop_address"] ?? "";
  const receiptFooter = settings?.["receipt_footer"] ?? "Thank you for shopping with us!";

  const handlePrint = () => {
    window.print();
  };

  if (!sale) return null;

  const paymentMethodLabel: Record<string, string> = {
    cash: "Cash",
    mpesa: "M-Pesa",
    card: "Card",
    split: "Split Payment",
  };

  return (
    <Modal isOpen={isOpen} onClose={onNewSale} title="Sale Complete" maxWidth="sm">
      <div className="no-print mb-4 flex gap-2">
        <Button variant="secondary" onClick={handlePrint} className="flex-1 gap-2">
          <Printer size={16} />
          Print Receipt
        </Button>
        <Button onClick={onNewSale} className="flex-1 gap-2">
          <ShoppingCart size={16} />
          New Sale
        </Button>
      </div>

      {/* Printable receipt */}
      <div className="receipt-printable border border-[#E0E0E0] rounded-md p-4 font-mono text-sm text-[#1E1B3A]">
        <div className="text-center mb-3">
          <p className="font-bold text-sm">{shopName}</p>
          {shopAddress && <p>{shopAddress}</p>}
          {shopPhone && <p>Tel: {shopPhone}</p>}
        </div>

        <div className="border-t border-b border-dashed border-[#9B9B9B] py-2 mb-2">
          <div className="flex justify-between">
            <span>Date: {formatDate(sale.createdAt)}</span>
            <span>Time: {formatTime(sale.createdAt)}</span>
          </div>
          <p>Cashier: {sale.cashierName}</p>
          <p>Sale #: {sale.saleNumber}</p>
          {sale.customerName !== "Walk-in" && <p>Customer: {sale.customerName}</p>}
        </div>

        <div className="space-y-1 mb-2">
          {sale.items.map((item, i) => (
            <div key={i}>
              <p className="font-medium">{item.productName} {item.brandName} {item.sizeMl}ml</p>
              <div className="flex justify-between pl-2">
                <span>{item.quantity} × {formatCurrency(item.unitPrice)}</span>
                <span>{formatCurrency(item.lineTotal)}</span>
              </div>
              {item.discount > 0 && (
                <div className="flex justify-between pl-2 text-[#16A34A]">
                  <span>Discount</span>
                  <span>-{formatCurrency(item.discount)}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="border-t border-dashed border-[#9B9B9B] pt-2 space-y-0.5">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatCurrency(sale.subtotal)}</span>
          </div>
          {sale.discountTotal > 0 && (
            <div className="flex justify-between">
              <span>Discount</span>
              <span>-{formatCurrency(sale.discountTotal)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>VAT ({(sale.taxRate * 100).toFixed(0)}%)</span>
            <span>{formatCurrency(sale.taxAmount)}</span>
          </div>
          <div className="flex justify-between font-bold text-sm pt-1 border-t border-dashed border-[#9B9B9B]">
            <span>TOTAL</span>
            <span>{formatCurrency(sale.grandTotal)}</span>
          </div>
        </div>

        <div className="border-t border-dashed border-[#9B9B9B] mt-2 pt-2 space-y-0.5">
          <p>Payment: {paymentMethodLabel[sale.paymentMethod]}</p>
          {sale.paymentDetails.cashAmount && (
            <p>Cash: {formatCurrency(sale.paymentDetails.cashAmount)}</p>
          )}
          {sale.paymentDetails.cashChange !== undefined && sale.paymentDetails.cashChange >= 0 && (
            <p>Change: {formatCurrency(sale.paymentDetails.cashChange)}</p>
          )}
          {sale.paymentDetails.mpesaRef && <p>Ref: {sale.paymentDetails.mpesaRef}</p>}
          {sale.paymentDetails.cardRef && <p>Card Ref: {sale.paymentDetails.cardRef}</p>}
        </div>

        <div className="text-center mt-3 border-t border-dashed border-[#9B9B9B] pt-2">
          <p>{receiptFooter}</p>
        </div>
      </div>
    </Modal>
  );
}
