import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ScannerCard from "../components/ui/POS/ScannerCard";
import SkuFormCard from "../components/ui/POS/SkuFormCard";
import CartTableCard from "../components/ui/POS/CartTableCard";
import Button from "../components/common/Button";
import { api, createGcashCheckout } from "../lib/api";
import PriceCheckModal from "../components/modals/PriceCheckModal";
import DiscountModal from "../components/modals/DiscountModal";
import CashLedgerModal from "../components/modals/CashLedgerModal";
import CheckoutModal from "../components/modals/CheckoutModal";
import CashPaymentModal from "../components/modals/CashPaymentModal";
import ScanCustomerCartModal from "../components/modals/ScanCustomerCartModal";
import ProfileModal from "../components/modals/ProfileModal";
import { BiBell, BiUser } from "react-icons/bi";

function CashierPOS() {
  const navigate = useNavigate();

  const [sku, setSku] = useState("");
  const [priceCheckSku, setPriceCheckSku] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState([]);
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [showDiscount, setShowDiscount] = useState(false);
  const [showPriceCheck, setShowPriceCheck] = useState(false);
  const [showImportCart, setShowImportCart] = useState(false);
  const [showCashLedger, setShowCashLedger] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showCashModal, setShowCashModal] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [scannerPaused, setScannerPaused] = useState(false);
  const [error, setError] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [transactionNumber, setTransactionNumber] = useState("");
  const [transactionId, setTransactionId] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const notificationRef = useRef(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const touchStartXRef = useRef(null);
  const touchActiveRef = useRef(false);

  const token = sessionStorage.getItem("auth_token");
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  const hasFinalizedRef = React.useRef(false);

  // Add keyboard shortcuts for buttons: F4-F8
  useEffect(() => {
    const keyDownHandler = (e) => {
      if (e.repeat) return;
      switch (e.key) {
        case "F4":
          e.preventDefault();
          setShowCashLedger(true);
          break;
        case "F5":
          e.preventDefault();
          setShowDiscount(true);
          break;
        case "F6":
          e.preventDefault();
          setShowPriceCheck(true);
          break;
        case "F7":
          e.preventDefault();
          setShowImportCart(true);
          break;
        case "F8":
          e.preventDefault();
          if (cart.length > 0) {
            setShowCheckout(true);
          }
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", keyDownHandler);
    return () => window.removeEventListener("keydown", keyDownHandler);
  }, [cart.length]);

  // Generate a client-side provisional transaction number when POS opens
  useEffect(() => {
    if (!transactionNumber) {
      const businessId = user?.businessId || user?.business_id || "BIZ";
      const timePart = new Date()
        .toISOString()
        .replace(/[-:T.Z]/g, "")
        .slice(0, 14);
      const randPart = Math.floor(1000 + Math.random() * 9000);
      setTransactionNumber(
        `T-${businessId.toString().padStart(2, "0")}-${timePart}-${randPart}`
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
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
              transaction_id: parsed.transactionId || null,
              transaction_number: parsed.transactionNumber || null,
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
              const url = new URL(window.location.origin + "/receipt");
              if (resp?.transaction_number)
                url.searchParams.set("tn", resp.transaction_number);
              if (resp?.transaction_id)
                url.searchParams.set("tid", String(resp.transaction_id));
              if (resp?.total != null)
                url.searchParams.set("total", String(resp.total));
              navigate(url.pathname + url.search);
            } catch (_) {}
          } catch (e) {
            setError("Failed to record GCASH payment");
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
      const businessId = user?.businessId || user?.business_id || null;
      const url = businessId
        ? `/api/products/sku/${encodeURIComponent(
            skuValue
          )}?business_id=${businessId}`
        : `/api/products/sku/${encodeURIComponent(skuValue)}`;

      const product = await api(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
      setError("Product not found");
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

  const completeTransactionCall = async (transId) => {
    if (!transId) return;
    try {
      const resp = await api(`/api/sales/${transId}/complete`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      return resp;
    } catch (err) {
      console.error("Failed to complete transaction:", err);
      setError("Failed to complete transaction");
      return null;
    }
  };

  const handleCheckout = async (
    paymentType = "cash",
    moneyReceived = total
  ) => {
    if (cart.length === 0) return;
    setError("");
    try {
      const body = {
        transaction_id: transactionId || null,
        transaction_number: transactionNumber || null,
        items: cart.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
        })),
        payment_type: paymentType,
        money_received: moneyReceived,
        ...(appliedDiscount &&
        typeof appliedDiscount.value === "string" &&
        appliedDiscount.value.endsWith("%")
          ? { discount_percentage: parseFloat(appliedDiscount.value) }
          : appliedDiscount
          ? { discount_amount: Number(appliedDiscount.value) }
          : {}),
      };
      const resp = await api("/api/sales/checkout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (resp?.transaction_number)
        setTransactionNumber(resp.transaction_number);
      if (resp?.transaction_id) setTransactionId(resp.transaction_id);

      // Removed redundant call to completeTransaction endpoint as checkout already sets status and cashier_user_id
      // if (resp?.transaction_id) {
      //   await completeTransactionCall(resp.transaction_id);
      // }

      setCart([]);
      try {
        const url = new URL(window.location.origin + "/receipt");
        if (resp?.transaction_number)
          url.searchParams.set("tn", resp.transaction_number);
        if (resp?.transaction_id)
          url.searchParams.set("tid", String(resp.transaction_id));
        if (resp?.total != null)
          url.searchParams.set("total", String(resp.total));
        navigate(url.pathname + url.search);
      } catch (_) {}
      // Start a fresh provisional transaction number after successful checkout
      const businessId = user?.businessId || user?.business_id || "BIZ";
      const timePart = new Date()
        .toISOString()
        .replace(/[-:T.Z]/g, "")
        .slice(0, 14);
      const randPart = Math.floor(1000 + Math.random() * 9000);
      setTransactionNumber(
        `T-${businessId.toString().padStart(2, "0")}-${timePart}-${randPart}`
      );
      setAppliedDiscount(null);
      setTransactionId(null);
    } catch (err) {
      setError("Checkout failed");
    }
  };

  const handleCopyTn = () => {
    navigator.clipboard.writeText(transactionNumber);
  };

  // show confirmation modal first, perform actual logout in confirmLogout
  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    sessionStorage.removeItem("auth_token");
    sessionStorage.removeItem("user");
    // close modal then navigate home
    setShowLogoutConfirm(false);
    navigate("/");
  };

  const headerActions = (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        title="Notifications"
      >
        <BiBell className="w-5 h-5 text-gray-600" />
      </button>
      <button
        onClick={() => setShowProfileModal(true)}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        title="Profile"
      >
        <BiUser className="w-5 h-5 text-gray-600" />
      </button>
      <button
        onClick={handleLogout}
        className="p-2 rounded-lg hover:bg-red-50 transition-colors"
        title="Logout"
      >
        <svg
          className="w-5 h-5 text-red-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1"
          />
        </svg>
      </button>
    </div>
  );

  const cardClass = "bg-white border border-blue-100 rounded-2xl p-6 shadow-lg";

  return (
    <div className="bg-white min-h-screen">
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="flex items-center gap-2 px-4 sm:px-6 py-3 bg-white/90 backdrop-blur-md shadow-md border-b border-gray-200/50 h-[64px] min-h-[64px] max-h-[64px] sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <span className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              POS
            </span>
          </div>
          <div className="flex-1 flex items-center justify-center px-2">
            <button
              onClick={handleCopyTn}
              title="Copy transaction number"
              className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg px-2.5 py-1.5 shadow-sm hover:bg-blue-100 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2M8 16h8a2 2 0 002-2v-6m-10 8l-2 2m2-2l2 2"
                />
              </svg>
              <span className="font-mono text-xs sm:text-sm md:text-base font-bold tracking-wider truncate max-w-[50vw]">
                {transactionNumber}
              </span>
            </button>
          </div>

          <div className="ml-auto">{headerActions}</div>
        </header>

        {/* Main Area */}
        <main className="flex-1 bg-gradient-to-br from-gray-50/50 via-blue-50/30 to-indigo-50/50 overflow-y-auto p-2 sm:p-3 md:p-4 pb-55 lg:pb-4">
          <div className="grid gap-2 sm:gap-3 md:gap-4 h-full grid-cols-1 lg:grid-cols-12">
            {/* Left Column - Scanner, SKU Form, Transaction */}
            <div className="lg:col-span-4 flex flex-col gap-2 sm:gap-3 md:gap-4">
              {/* ScannerCard */}
              <div className="flex-shrink-0">
                <ScannerCard
                  onScan={async (result) => {
                    const code = result?.[0]?.rawValue;
                    if (!code) return;
                    setScannerPaused(true);
                    if (showPriceCheck) {
                      setPriceCheckSku(code);
                    } else {
                      try {
                        let scannedData;
                        try {
                          scannedData = JSON.parse(code);
                        } catch (e) {
                          scannedData = null;
                        }
                        if (
                          scannedData &&
                          scannedData.t === "cart" &&
                          Array.isArray(scannedData.items)
                        ) {
                          // set transactionId from scanned data if present
                          if (scannedData.transaction_id) {
                            setTransactionId(scannedData.transaction_id);
                          }
                          // set transaction_number from scanned data if present
                          if (scannedData.transaction_number) {
                            setTransactionNumber(
                              scannedData.transaction_number
                            );
                          }
                          const items = scannedData.items.map((it) => ({
                            product_id: it.p,
                            quantity: it.q,
                            sku: it.sku || "",
                          }));
                          try {
                            const fetchedProducts = await Promise.all(
                              items.map(async (item) => {
                                const res = await api(
                                  `/api/products/${item.product_id}`,
                                  {
                                    headers: {
                                      Authorization: `Bearer ${token}`,
                                    },
                                  }
                                );
                                return {
                                  product_id: item.product_id,
                                  sku: res.sku || item.sku || "",
                                  name: res.product_name || "",
                                  price: Number(res.selling_price) || 0,
                                  quantity: item.quantity,
                                };
                              })
                            );
                            setCart((prev) => {
                              const byProductId = new Map(
                                prev.map((i) => [i.product_id, i])
                              );
                              for (const it of fetchedProducts) {
                                const existing = byProductId.get(it.product_id);
                                if (existing) {
                                  existing.quantity += it.quantity;
                                } else {
                                  byProductId.set(it.product_id, { ...it });
                                }
                              }
                              return Array.from(byProductId.values());
                            });
                            return;
                          } catch (err) {
                            console.error(
                              "Error fetching product details for scanned cart:",
                              err
                            );
                            // fallback to merging raw scanned items without product details
                            setCart((prev) => {
                              const byProductId = new Map(
                                prev.map((i) => [i.product_id, i])
                              );
                              for (const it of items) {
                                const existing = byProductId.get(it.product_id);
                                if (existing) {
                                  existing.quantity += it.quantity;
                                } else {
                                  byProductId.set(it.product_id, {
                                    ...it,
                                    name: "",
                                    price: 0,
                                  });
                                }
                              }
                              return Array.from(byProductId.values());
                            });
                            return;
                          }
                        }
                        await addSkuToCart(code, 1);
                      } catch (err) {
                        console.error("Error processing scanned code:", err);
                        await addSkuToCart(code, 1);
                      }
                    }
                  }}
                  paused={scannerPaused}
                  onResume={() => setScannerPaused(false)}
                  textMain="text-blue-700"
                />
              </div>

              {/* SkuFormCard */}
              <div className="flex-shrink-0">
                <SkuFormCard
                  sku={sku}
                  setSku={setSku}
                  quantity={quantity}
                  setQuantity={setQuantity}
                  handleAddToCart={handleAddToCart}
                />
                {error && (
                  <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-3 flex items-start gap-2 mt-3">
                    <svg
                      className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                    <p className="text-sm font-medium text-red-700">
                      {(() => {
                        try {
                          const parsed = JSON.parse(error);
                          return parsed.error || parsed.message || error;
                        } catch {
                          return error;
                        }
                      })()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Cart and Actions */}
            <div className="lg:col-span-8 flex flex-col gap-2 sm:gap-3 min-h-0">
              {/* CartTableCard */}
              <div className="flex-1 overflow-auto">
                <CartTableCard
                  cart={cart}
                  handleRemove={handleRemove}
                  total={total}
                  className="flex-1 h-full"
                />
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-12 gap-2 sm:gap-3 flex-shrink-0">
                {/* Grouped Buttons */}
                <div className="col-span-8">
                  <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 sm:gap-3">
                    <Button
                      label="CASH LEDGER (F4)"
                      size="md"
                      className="w-full h-10 sm:h-12 text-xs sm:text-sm font-bold"
                      variant="secondary"
                      microinteraction
                      onClick={() => setShowCashLedger(true)}
                      icon={
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      }
                      iconPosition="left"
                    />
                    <Button
                      label="DISCOUNT (F5)"
                      size="md"
                      className="w-full h-10 sm:h-12 text-xs sm:text-sm font-bold"
                      onClick={() => setShowDiscount(true)}
                      variant="secondary"
                      microinteraction
                      icon={
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      }
                      iconPosition="left"
                    />
                    <Button
                      label="PRICE CHECK (F6)"
                      size="md"
                      className="w-full h-10 sm:h-12 text-xs sm:text-sm font-bold"
                      onClick={() => setShowPriceCheck(true)}
                      variant="secondary"
                      microinteraction
                      icon={
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      }
                      iconPosition="left"
                    />
                    <Button
                      label="IMPORT CART (F7)"
                      size="md"
                      className="w-full h-10 sm:h-12 text-xs sm:text-sm font-bold"
                      onClick={() => setShowImportCart(true)}
                      variant="secondary"
                      microinteraction
                      icon={
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                          />
                        </svg>
                      }
                      iconPosition="left"
                    />
                  </div>
                </div>

                {/* Checkout Button */}
                <div className="col-span-4">
                  <Button
                    label="CHECKOUT (F8)"
                    size="md"
                    className="w-full h-full text-sm sm:text-base font-bold"
                    variant="primary"
                    microinteraction
                    onClick={() => setShowCheckout(true)}
                    disabled={cart.length === 0}
                    icon={
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    }
                    iconPosition="left"
                  />
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Modals */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setShowLogoutConfirm(false)}
            />
            <div className="relative bg-white rounded-xl shadow-xl w-[92%] max-w-md p-6 z-10">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Confirm Logout
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to log out?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="px-3 py-2 rounded-lg bg-gray-100 text-sm font-medium hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  className="px-3 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
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
          sku={priceCheckSku}
          setSku={setPriceCheckSku}
        />
        <CashLedgerModal
          isOpen={showCashLedger}
          onClose={() => setShowCashLedger(false)}
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
                        transactionId: transactionId,
                        transactionNumber: transactionNumber,
                      })
                    );
                    const { checkoutUrl } = await createGcashCheckout({
                      amount: Number(total || 0),
                      description: "POS Order",
                      referenceNumber: transactionNumber || `POS-${Date.now()}`,
                      cancelUrl,
                      successUrl,
                    });
                    window.location.href = checkoutUrl;
                  } catch (e) {
                    setError("Failed to init GCash");
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
        <ScanCustomerCartModal
          isOpen={showImportCart}
          onClose={() => setShowImportCart(false)}
          onImport={async (items) => {
            try {
              console.log("Scanned items:", items);
              // Fetch product details by product_id for all scanned items concurrently
              const fetchedProducts = await Promise.all(
                items.map(async (item) => {
                  const res = await api(`/api/products/${item.product_id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  console.log(
                    "Fetched product for id",
                    item.product_id,
                    ":",
                    res
                  );
                  return {
                    product_id: item.product_id,
                    sku: res.sku || item.sku || "",
                    name: res.product_name || "",
                    price: Number(res.selling_price) || 0,
                    quantity: item.quantity,
                  };
                })
              );
              setCart((prev) => {
                const bySku = new Map(prev.map((i) => [i.sku, i]));
                for (const it of fetchedProducts) {
                  const existing = bySku.get(it.sku);
                  if (existing) existing.quantity += it.quantity;
                  else bySku.set(it.sku, { ...it });
                }
                return Array.from(bySku.values());
              });
            } catch (e) {
              console.error("Error fetching products for scanned items:", e);
              // Fallback to use raw items if fetch fails
              setCart((prev) => {
                const bySku = new Map(prev.map((i) => [i.sku, i]));
                for (const it of items) {
                  const existing = bySku.get(it.sku);
                  if (existing) existing.quantity += it.quantity;
                  else bySku.set(it.sku, { ...it });
                }
                return Array.from(bySku.values());
              });
            }
          }}
        />
        <ProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          userData={user}
        />
      </div>
    </div>
  );
}

export default CashierPOS;
