import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../hooks/useAuth";
import { useCart } from "../hooks/useCart";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { ProductGrid } from "../components/pos/ProductGrid";
import { CartPanel } from "../components/pos/CartPanel";
import { PaymentModal } from "../components/pos/PaymentModal";
import { ReceiptModal } from "../components/pos/ReceiptModal";
import { formatDateTime, formatCurrency } from "../lib/utils";
import { Lock, LayoutGrid, PauseCircle, Clock, ShoppingCart, LayoutDashboard } from "lucide-react";
import { BottomNav } from "../components/layout/BottomNav";
import type { Id } from "../../convex/_generated/dataModel";

export function POSPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const cart = useCart();
  const searchRef = useRef<HTMLInputElement>(null);

  const [showPayment, setShowPayment] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [completedSaleId, setCompletedSaleId] = useState<string | null>(null);
  const [showHeldSales, setShowHeldSales] = useState(false);
  const [mobileTab, setMobileTab] = useState<"products" | "cart">("products");

  const holdSale = useMutation(api.sales.holdSale);
  const releaseHold = useMutation(api.sales.releaseHold);
  const heldSales = useQuery(api.sales.getHeldSales);
  const settings = useQuery(api.settings.getAll);
  const shopName = settings === undefined ? "" : (settings["shop_name"] ?? "Perfume POS");

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleHold = useCallback(async () => {
    if (cart.isEmpty) return;
    if ((heldSales?.length ?? 0) >= 10) {
      alert("Maximum 10 held sales. Resume or clear a held sale first.");
      return;
    }
    try {
      await holdSale({
        cashierId: user!._id,
        customerId: cart.customerId ?? undefined,
        items: cart.items.map((item) => ({
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
        subtotal: cart.totals.subtotal,
        discountTotal: cart.totals.discountTotal,
        taxRate: 0.16,
        taxAmount: cart.totals.taxAmount,
        grandTotal: cart.totals.grandTotal,
      });
      cart.clearCart();
    } catch {
      // hold failed
    }
  }, [cart, holdSale, user, heldSales]);

  type HeldSaleItem = NonNullable<typeof heldSales>[number];
  const handleResumeHold = useCallback(async (heldSale: HeldSaleItem) => {
    if (!heldSale) return;
    // Restore cart from held sale
    for (const item of heldSale.items) {
      cart.addItem({
        variantId: item.variantId,
        productId: item.variantId as unknown as Id<"products">,
        productName: item.productName,
        brandName: item.brandName,
        sizeMl: item.sizeMl,
        sku: item.sku,
        unitPrice: item.unitPrice,
        maxStock: 999,
      });
    }
    await releaseHold({ saleId: heldSale._id });
    setShowHeldSales(false);
  }, [cart, releaseHold]);

  const handleSaleComplete = (saleId: string, _saleNumber: string) => {
    cart.clearCart();
    setShowPayment(false);
    setCompletedSaleId(saleId);
    setShowReceipt(true);
  };

  useKeyboardShortcuts({
    "F1": () => { setMobileTab("products"); setTimeout(() => searchRef.current?.focus(), 50); },
    "F5": handleHold,
    "F9": () => cart.clearCart(),
    "F12": () => { if (!cart.isEmpty) { setMobileTab("cart"); setShowPayment(true); } },
    "Escape": () => { setShowPayment(false); setShowReceipt(false); setShowHeldSales(false); },
  });

  const heldCount = heldSales?.length ?? 0;

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden pb-0 md:pb-0">
      {/* POS Header */}
      <header className="h-14 bg-[#6B1A2A] text-white flex items-center px-4 gap-3 flex-shrink-0">
        {/* Brand */}
        <div className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <LayoutGrid size={16} />
          <span>{shopName}</span>
        </div>

        <div className="flex-1" />

        {/* Clock */}
        <div className="flex items-center gap-1.5 text-sm text-white/60 font-mono">
          <Clock size={13} />
          <span>{now.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}</span>
        </div>

        {/* Held sales */}
        {heldCount > 0 && (
          <button
            onClick={() => setShowHeldSales(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-500/20 text-sm text-amber-300 hover:bg-amber-500/30 transition-colors"
          >
            <PauseCircle size={14} />
            {heldCount} Held
          </button>
        )}

        {/* Cashier badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/10 text-sm text-white/90">
          <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold uppercase flex-shrink-0">
            {user?.name?.charAt(0)}
          </span>
          <span className="hidden sm:inline max-w-[100px] truncate">{user?.name}</span>
        </div>

        {/* Dashboard button — admin only, clearly labelled */}
        {user?.role === "admin" && (
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-sm text-white transition-colors"
          >
            <LayoutDashboard size={15} />
            <span className="hidden sm:inline">Dashboard</span>
          </button>
        )}

        {/* Lock */}
        <button
          onClick={() => { logout(); navigate("/login"); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-sm text-white/80 hover:text-white transition-colors"
          title="Sign Out"
        >
          <Lock size={14} />
          <span className="hidden sm:inline">Lock</span>
        </button>
      </header>

      {/* Main POS Area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Product area — full width on mobile, 60% on desktop */}
        <div className={`overflow-hidden transition-all ${mobileTab === "cart" ? "hidden md:flex md:flex-1" : "flex-1"}`}>
          <ProductGrid onAddItem={(item) => { cart.addItem(item); }} searchRef={searchRef} />
        </div>

        {/* Cart panel — full screen on mobile when active, 40% on desktop */}
        <div className={`flex-shrink-0 md:w-[40%] md:max-w-md ${mobileTab === "products" ? "hidden md:block" : "w-full"}`}>
          <CartPanel
            items={cart.items}
            totals={cart.totals}
            saleDiscount={cart.saleDiscount}
            customerId={cart.customerId}
            onUpdateQuantity={cart.updateQuantity}
            onRemoveItem={cart.removeItem}
            onSetDiscount={cart.setSaleDiscount}
            onSetCustomer={cart.setCustomerId}
            onClear={cart.clearCart}
            onHold={handleHold}
            onPay={() => setShowPayment(true)}
            cashierRole={user?.role ?? "cashier"}
            onBack={() => setMobileTab("products")}
          />
        </div>

        {/* Mobile sticky cart bar — always visible on products tab, above bottom nav */}
        {mobileTab === "products" && (
          <div className="md:hidden fixed bottom-16 inset-x-0 bg-white border-t border-[#E0E0E0] px-4 py-3 z-30 shadow-lg">
            <button
              onClick={() => setMobileTab("cart")}
              className="w-full flex items-center justify-between"
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-[#6B1A2A]">
                <ShoppingCart size={16} />
                {cart.isEmpty ? "Cart" : `${cart.items.reduce((s, i) => s + i.quantity, 0)} items`}
              </span>
              {!cart.isEmpty && (
                <span className="text-base font-semibold font-mono text-[#6B1A2A]">
                  {formatCurrency(cart.totals.grandTotal)}
                </span>
              )}
              <span className="text-sm font-semibold text-[#6B1A2A]">View Cart →</span>
            </button>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {user && (
        <PaymentModal
          isOpen={showPayment}
          onClose={() => setShowPayment(false)}
          grandTotal={cart.totals.grandTotal}
          subtotal={cart.totals.subtotal}
          discountTotal={cart.totals.discountTotal}
          taxAmount={cart.totals.taxAmount}
          taxRate={0.16}
          items={cart.items}
          cashierId={user._id}
          customerId={cart.customerId}
          saleDiscount={cart.saleDiscount}
          onComplete={handleSaleComplete}
        />
      )}

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={showReceipt}
        saleId={completedSaleId}
        onNewSale={() => { setShowReceipt(false); setCompletedSaleId(null); }}
      />

      {/* Bottom nav — mobile only */}
      <BottomNav />

      {/* Held Sales Dialog */}
      {showHeldSales && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowHeldSales(false)} />
          <div className="relative bg-white rounded-md border border-[#E0E0E0] w-full max-w-md p-6 shadow-sm">
            <h2 className="text-sm font-semibold mb-4">Held Sales ({heldCount})</h2>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {(heldSales ?? []).map((sale) => (
                <button
                  key={sale._id}
                  onClick={() => handleResumeHold(sale)}
                  className="w-full text-left p-3 border border-[#E0E0E0] rounded-md hover:bg-[#F7F7F7] transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium">{sale.saleNumber}</p>
                      <p className="text-sm text-[#6B6B6B]">{formatDateTime(sale.createdAt)}</p>
                      <p className="text-sm text-[#6B6B6B]">{sale.items.length} items</p>
                    </div>
                    <p className="text-sm font-mono font-semibold">
                      {new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES" }).format(sale.grandTotal)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowHeldSales(false)}
              className="mt-4 w-full h-10 border border-[#E0E0E0] rounded-md text-sm text-[#6B6B6B] hover:bg-[#F7F7F7] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
