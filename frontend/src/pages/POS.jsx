import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ScannerCard from "../components/ui/POS/ScannerCard";
import SkuFormCard from "../components/ui/POS/SkuFormCard";
import TransactionCard from "../components/ui/POS/TransactionCard";
import CartTableCard from "../components/ui/POS/CartTableCard";
import Button from "../components/common/Button";
import NavAdmin from "../components/layout/Nav-Admin";
// Background gradient removed for a neutral look
import { api, createGcashCheckout } from "../lib/api";
import PriceCheckModal from "../components/modals/PriceCheckModal";
import DiscountModal from "../components/modals/DiscountModal";
import CashLedgerModal from "../components/modals/CashLedgerModal";
import ProductReplacementModal from "../components/modals/ProductReplacementModal";
import CheckoutModal from "../components/modals/CheckoutModal";
import CashPaymentModal from "../components/modals/CashPaymentModal";
import ScanCustomerCartModal from "../components/modals/ScanCustomerCartModal";
import ProfileModal from "../components/modals/ProfileModal";
import { BiBell, BiSync, BiUser } from "react-icons/bi";
import { MdClose } from "react-icons/md";

function POS() {
  const navigate = useNavigate();

  // States
  const [sku, setSku] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState([]);
  const [showRefund, setShowRefund] = useState(false);
  const [showDiscount, setShowDiscount] = useState(false);
  const [showPriceCheck, setShowPriceCheck] = useState(false);
  const [showImportCart, setShowImportCart] = useState(false);
  const [showCashLedger, setShowCashLedger] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [scannerPaused, setScannerPaused] = useState(false);
  const [error, setError] = useState("");
  const [transactionNumber, setTransactionNumber] = useState("");
  const [transactionId, setTransactionId] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const notificationRef = useRef(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const touchStartXRef = useRef(null);
  const touchActiveRef = useRef(false);

  const token = localStorage.getItem("auth_token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const hasFinalizedRef = React.useRef(false);

  // Generate a client-side provisional transaction number when POS opens
  useEffect(() => {
    if (!transactionNumber) {
      const businessId = user?.businessId || user?.business_id || "BIZ";
      const timePart = new Date()
        .toISOString()
        .replace(/[-:T.Z]/g, "")
        .slice(0, 14);
      const randPart = Math.floor(1000 + Math.random() * 9000);
      setTransactionNumber(`T-${businessId}-${timePart}-${randPart}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // On mount, if returned from PayMongo success/cancel, finalize or cleanup
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("payment");
    const pending = localStorage.getItem("pending_gcash_cart");
    if (status === "success" && pending) {
      try {
        const parsed = JSON.parse(pending);
        // finalize checkout using saved items
        (async () => {
          if (hasFinalizedRef.current) return;
          const guardKey = "gcash_finalize_done";
          if (sessionStorage.getItem(guardKey) === "1") return;
          hasFinalizedRef.current = true;
          sessionStorage.setItem(guardKey, "1");
          try {
            setError("");
            const body = {
              items: parsed.items || [],
              payment_type: "gcash",
              money_received: parsed.total || null,
            };
            const resp = await api("/api/sales/checkout", {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
              body: JSON.stringify(body),
            });
            if (resp?.transaction_number)
              setTransactionNumber(resp.transaction_number);
            if (resp?.transaction_id) setTransactionId(resp.transaction_id);
            setCart([]);
            try {
              const url = new URL(window.location.origin + '/receipt');
              if (resp?.transaction_number) url.searchParams.set('tn', resp.transaction_number);
              if (resp?.transaction_id) url.searchParams.set('tid', String(resp.transaction_id));
              if (resp?.total != null) url.searchParams.set('total', String(resp.total));
              window.location.href = url.toString();
            } catch (_) {}
          } catch (e) {
            setError(e.message || "Failed to record GCASH payment");
          } finally {
            localStorage.removeItem("pending_gcash_cart");
            // remove query param
            const url = new URL(window.location.href);
            url.searchParams.delete("payment");
            window.history.replaceState({}, "", url.toString());
          }
        })();
      } catch (_) {
        localStorage.removeItem("pending_gcash_cart");
      }
    } else if (status === "cancel") {
      localStorage.removeItem("pending_gcash_cart");
      const url = new URL(window.location.href);
      url.searchParams.delete("payment");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  const addSkuToCart = async (skuValue, qty = 1) => {
    if (!skuValue || qty < 1) return;
    setError("");
    try {
      const product = await api(
        `/api/products/sku/${encodeURIComponent(skuValue)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const price = Number(product.selling_price || 0);
      const stockQty = Number(product.stock_quantity ?? 0);
      if (stockQty <= 0) {
        setError(
          `Stock for ${product.product_name} (SKU ${product.sku}) is 0.`
        );
        return;
      }
      if (qty > stockQty) {
        setError(
          `Insufficient stock. Available: ${stockQty}, requested: ${qty}.`
        );
        return;
      }
      setCart((prev) => {
        const existingIdx = prev.findIndex(
          (i) => i.product_id === product.product_id
        );
        if (existingIdx >= 0) {
          const next = [...prev];
          const newQty = next[existingIdx].quantity + qty;
          if (newQty > stockQty) {
            setError(
              `Insufficient stock. Available: ${stockQty}, requested: ${newQty}.`
            );
            return prev;
          }
          next[existingIdx] = { ...next[existingIdx], quantity: newQty };
          return next;
        }
        return [
          ...prev,
          {
            product_id: product.product_id,
            sku: product.sku,
            name: product.product_name,
            quantity: qty,
            price,
          },
        ];
      });
      setSku("");
      setQuantity(1);
      setScannerPaused(false);
    } catch (err) {
      setError(err.message || "Product not found");
    }
  };

  const handleAddToCart = async () => {
    await addSkuToCart(sku, quantity);
  };

  const handleRemove = (idx) => setCart(cart.filter((_, i) => i !== idx));

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Placeholder for appliedDiscount state and discount calculation if needed
  // const [appliedDiscount, setAppliedDiscount] = useState(null);
  // const total = calculateTotalWithDiscount(subtotal, appliedDiscount);
  // For now, total equals subtotal
  const total = subtotal;

  const handleCheckout = async (
    paymentType = "cash",
    moneyReceived = total
  ) => {
    if (cart.length === 0) return;
    setError("");
    try {
      const body = {
        items: cart.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
        })),
        payment_type: paymentType,
        money_received: moneyReceived,
      };
      const resp = await api("/api/sales/checkout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (resp?.transaction_number)
        setTransactionNumber(resp.transaction_number);
      if (resp?.transaction_id) setTransactionId(resp.transaction_id);
      setCart([]);
      try {
        const url = new URL(window.location.origin + '/receipt');
        if (resp?.transaction_number) url.searchParams.set('tn', resp.transaction_number);
        if (resp?.transaction_id) url.searchParams.set('tid', String(resp.transaction_id));
        if (resp?.total != null) url.searchParams.set('total', String(resp.total));
        navigate(url.pathname + url.search);
      } catch (_) {}
      // Start a fresh provisional transaction number after successful checkout
      const businessId = user?.businessId || user?.business_id || "BIZ";
      const timePart = new Date()
        .toISOString()
        .replace(/[-:T.Z]/g, "")
        .slice(0, 14);
      const randPart = Math.floor(1000 + Math.random() * 9000);
      setTransactionNumber(`T-${businessId}-${timePart}-${randPart}`);
      // setAppliedDiscount(null); // if using discount
    } catch (err) {
      setError(err.message || "Checkout failed");
    }
  };

  // Sample notifications - replace with actual notifications data
  const notifications = [
    {
      id: 1,
      title: "Low Stock Alert",
      message: "Item SKU#123 is running low on stock",
      time: "2 mins ago",
      isRead: false,
    },
    {
      id: 2,
      title: "New Transaction",
      message: "Transaction #45678 completed successfully",
      time: "5 mins ago",
      isRead: false,
    },
    {
      id: 3,
      title: "System Update",
      message: "POS System will update in 30 minutes",
      time: "10 mins ago",
      isRead: true,
    },
  ];

  // Close dropdown when clicking outside notifications
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const headerActions = (
    <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
      <button
        className="p-2 rounded-full hover:bg-gray-400 transition-colors"
        onClick={() => {
          /* Add sync logic here */
        }}
        title="Sync Data"
      >
        <BiSync className="w-6 h-6 text-gray-700" />
      </button>

      {/* Notification Button with Dropdown */}
      <div className="relative" ref={notificationRef}>
        <button
          className="p-2 rounded-full hover:bg-gray-400 transition-colors relative"
          onClick={() => setShowNotifications(!showNotifications)}
          title="Notifications"
        >
          <BiBell className="w-6 h-6 text-gray-700" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {notifications.filter((n) => !n.isRead).length}
          </span>
        </button>

        {showNotifications && (
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowNotifications(false)}
              >
                <MdClose className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                      !notification.isRead ? "bg-blue-50" : ""
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-gray-900">
                        {notification.title}
                      </h4>
                      <span className="text-xs text-gray-500">
                        {notification.time}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {notification.message}
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500">
                  No notifications
                </div>
              )}
            </div>
            {notifications.length > 0 && (
              <div className="p-3 text-center border-t border-gray-200">
                <button
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  onClick={() => {
                    /* Add clear all logic */
                  }}
                >
                  Clear all notifications
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cashier Profile Button */}
      <button
        onClick={() => setShowProfileModal(true)}
        className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow-sm hover:bg-gray-50 transition-colors group"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600">Cashier</span>
          <span className="text-sm font-bold text-gray-900">#123</span>
        </div>
        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
          {user?.profileImage ? (
            <img
              src={user.profileImage}
              alt="Profile"
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            <BiUser className="h-5 w-5 text-gray-600" />
          )}
        </div>
      </button>
    </div>
  );

  return (
    <div className="bg-white min-h-screen">
      <div
        className="flex min-h-screen overflow-y-auto md:overflow-hidden"
        onTouchStart={(e) => {
          if (window.innerWidth >= 768) return;
          const x = e.touches?.[0]?.clientX ?? 0;
          // Start tracking if swipe begins near left edge or drawer is open
          if (!isMobileNavOpen && x <= 24) {
            touchActiveRef.current = true;
            touchStartXRef.current = x;
          } else if (isMobileNavOpen) {
            touchActiveRef.current = true;
            touchStartXRef.current = x;
          }
        }}
        onTouchMove={(e) => {
          if (!touchActiveRef.current) return;
          const x = e.touches?.[0]?.clientX ?? 0;
          const delta = x - (touchStartXRef.current ?? x);
          // Open when swiping right from edge; close when swiping left while open
          if (!isMobileNavOpen && delta > 60) {
            setIsMobileNavOpen(true);
            touchActiveRef.current = false;
            touchStartXRef.current = null;
          } else if (isMobileNavOpen && delta < -60) {
            setIsMobileNavOpen(false);
            touchActiveRef.current = false;
            touchStartXRef.current = null;
          }
        }}
        onTouchEnd={() => {
          touchActiveRef.current = false;
          touchStartXRef.current = null;
        }}
      >
        {/* Sidebar */}
        <div className="hidden md:block">
          <NavAdmin />
        </div>
        {/* Mobile Off-canvas Nav */}
        <div
          className={`md:hidden fixed inset-y-0 left-0 z-50 w-64 max-w-[80vw] bg-white shadow-xl transform transition-transform duration-300 ${
            isMobileNavOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <NavAdmin />
        </div>
        {isMobileNavOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black/30 z-40"
            onClick={() => setIsMobileNavOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 md:ml-48 ml-0 flex flex-col min-h-screen">
          {/* Header */}
          <header className="flex items-center gap-4 px-6 py-3 bg-white/80 shadow-sm border-b border-blue-100 h-[56px] min-h-[56px] max-h-[56px]">
            <span className="text-2xl font-bold text-blue-700 tracking-tight flex items-center gap-2">
              <span className="bg-blue-600 text-white rounded-xl px-3 py-1 text-xl font-bold mr-2">
                eK
              </span>
              POS
            </span>

            <div className="ml-auto">{headerActions}</div>
          </header>

          {/* Main Area */}
          <main className="flex-1 bg-transparent overflow-hidden p-4">
            <div className="grid gap-4 md:gap-8 h-full grid-cols-1 md:[grid-template-columns:1fr_2fr] md:[grid-template-rows:325px_325px_1fr_120px]">
              {/* ScannerCard */}
              <div className="row-span-1 col-span-1">
                <ScannerCard
                  onScan={async (result) => {
                    const code = result?.[0]?.rawValue;
                    if (!code) return;
                    setScannerPaused(true);
                    await addSkuToCart(code, 1);
                  }}
                  paused={scannerPaused}
                  onResume={() => setScannerPaused(false)}
                  textMain="text-blue-700"
                />
              </div>

              {/* CartTableCard */}
              <div className="md:row-span-3 md:col-start-2 md:row-start-1 flex flex-col h-full">
                <CartTableCard
                  cart={cart}
                  handleRemove={handleRemove}
                  total={total}
                  className="flex-1"
                />

                {/* Action Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 mt-4">
                  <Button
                    label="CASH LEDGER"
                    size="lg"
                    className="w-full h-16 text-base font-bold"
                    variant="secondary"
                    microinteraction
                    onClick={() => setShowCashLedger(true)}
                  />
                  <Button
                    label="DISCOUNT"
                    size="lg"
                    className="w-full h-16 text-base font-bold"
                    onClick={() => setShowDiscount(true)}
                    variant="secondary"
                    microinteraction
                  />
                  {/* Big Checkout Button */}
                  <Button
                    label="CHECKOUT"
                    size="lg"
                    className="w-full h-35 text-lg font-bold row-span-2"
                    variant="primary"
                    microinteraction
                    onClick={() => setShowCheckout(true)}
                  />
                  <Button
                    label="IMPORT CUSTOMER CART"
                    size="lg"
                    className="w-full h-16 text-base font-bold"
                    onClick={() => setShowImportCart(true)}
                    variant="secondary"
                    microinteraction
                  />
                  <Button
                    label="REFUND"
                    size="lg"
                    className="w-full h-16 text-base font-bold"
                    onClick={() => setShowRefund(true)}
                    variant="secondary"
                    microinteraction
                  />
                  <Button
                    label="PRICE CHECK"
                    size="lg"
                    className="w-full h-16 text-base font-bold"
                    onClick={() => setShowPriceCheck(true)}
                    variant="secondary"
                    microinteraction
                  />
                </div>
              </div>

              {/* SkuFormCard */}
              <div className="md:row-start-2 md:col-start-1 mb-0">
                <SkuFormCard
                  sku={sku}
                  setSku={setSku}
                  quantity={quantity}
                  setQuantity={setQuantity}
                  handleAddToCart={handleAddToCart}
                />
                {error && (
                  <div className="text-red-600 text-sm mt-2">{error}</div>
                )}
              </div>

              {/* TransactionCard */}
              <div className="md:row-start-3 md:col-start-1 md:-mt-16">
                <TransactionCard
                  transactionNumber={transactionNumber}
                  transactionId={transactionId}
                />
              </div>
            </div>
          </main>

          {/* Modals */}
          <DiscountModal
            isOpen={showDiscount}
            onClose={() => setShowDiscount(false)}
            onApplyDiscount={(discount) => {
              // Apply the discount to your transaction/cart here
              // Optionally handle discount state update
              setShowDiscount(false);
            }}
          />
          <PriceCheckModal
            isOpen={showPriceCheck}
            onClose={() => setShowPriceCheck(false)}
          />
          <CashLedgerModal
            isOpen={showCashLedger}
            onClose={() => setShowCashLedger(false)}
          />
          <ProductReplacementModal
            isOpen={showRefund}
            onClose={() => setShowRefund(false)}
            onConfirm={(data) => {
              // Handle refund logic here
              setShowRefund(false);
            }}
          />
          <CheckoutModal
            isOpen={showCheckout}
            onClose={() => setShowCheckout(false)}
            total={total}
            onSelectPayment={(method) => {
              setSelectedPayment(method);
              setShowCheckout(false);

              if (method === "cash") {
                setShowCashModal(true);
              } else {
                if (method === "gcash") {
                  (async () => {
                    try {
                      const successUrl =
                        window.location.origin + "/pos?payment=success";
                      const cancelUrl =
                        window.location.origin + "/pos?payment=cancel";
                      // persist cart to finalize after redirect back
                      localStorage.setItem(
                        "pending_gcash_cart",
                        JSON.stringify({
                          items: cart.map((i) => ({
                            product_id: i.product_id,
                            quantity: i.quantity,
                          })),
                          total,
                        })
                      );
                      const { checkoutUrl } = await createGcashCheckout({
                        amount: Number(total || 0),
                        description: "POS Order",
                        referenceNumber:
                          transactionNumber || `POS-${Date.now()}`,
                        cancelUrl,
                        successUrl,
                      });
                      window.location.href = checkoutUrl;
                    } catch (e) {
                      setError(e.message || "Failed to init GCash");
                      localStorage.removeItem("pending_gcash_cart");
                    }
                  })();
                } else {
                  // For MAYA or others, fall back to existing checkout flow
                  handleCheckout(method);
                }
              }
            }}
          />
          <CashPaymentModal
            isOpen={showCashModal}
            onClose={() => setShowCashModal(false)}
            total={total}
            onConfirm={(amountReceived) => {
              handleCheckout("cash", amountReceived);
              setShowCashModal(false);
            }}
          />
          <ProfileModal
            isOpen={showProfileModal}
            onClose={() => setShowProfileModal(false)}
            userData={user}
          />
          <ScanCustomerCartModal
            isOpen={showImportCart}
            onClose={() => setShowImportCart(false)}
            onImport={(items) => {
              // Merge imported items into current cart
              setCart((prev) => {
                const bySku = new Map(prev.map(i => [i.sku, i]));
                for (const it of items) {
                  const existing = bySku.get(it.sku);
                  if (existing) {
                    existing.quantity += it.quantity;
                  } else {
                    bySku.set(it.sku, { ...it });
                  }
                }
                return Array.from(bySku.values());
              });
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default POS;
