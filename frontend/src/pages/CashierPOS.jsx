import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ScannerCard from "../components/ui/POS/ScannerCard";
import SkuFormCard from "../components/ui/POS/SkuFormCard";
import CartTableCard from "../components/ui/POS/CartTableCard";
import Button from "../components/common/Button";
import { api, createGcashCheckout, createMayaCheckout } from "../lib/api";
import PriceCheckModal from "../components/modals/PriceCheckModal";
import DiscountModal from "../components/modals/DiscountModal";
import CashLedgerModal from "../components/modals/CashLedgerModal";
import CheckoutModal from "../components/modals/CheckoutModal";
import CashPaymentModal from "../components/modals/CashPaymentModal";
import ScanCustomerCartModal from "../components/modals/ScanCustomerCartModal";
import ProfileModal from "../components/modals/ProfileModal";
import RecentReceiptsModal from "../components/modals/RecentReceiptsModal";
import { BiReceipt, BiUser } from "react-icons/bi";

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
  const [showReceipts, setShowReceipts] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const notificationRef = useRef(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const touchStartXRef = useRef(null);
  const touchActiveRef = useRef(false);
  const [selectedCartIdx, setSelectedCartIdx] = useState(0);
  const skuInputRef = useRef(null);
  const quantityInputRef = useRef(null);

  const token = sessionStorage.getItem("auth_token");
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  const hasFinalizedRef = React.useRef(false);

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
        case "Delete":
          e.preventDefault();
          setCart((prev) => {
            if (prev.length === 0) return prev;
            const next = [...prev];
            next.splice(selectedCartIdx ?? 0, 1);
            return next;
          });
          setSelectedCartIdx((idx) => Math.max(0, idx - 1));
          break;
        case "ArrowDown":
          if (cart.length > 0) {
            e.preventDefault();
            setSelectedCartIdx((idx) =>
              Math.min(cart.length - 1, (idx ?? 0) + 1)
            );
          }
          break;
        case "ArrowUp":
          if (cart.length > 0) {
            e.preventDefault();
            setSelectedCartIdx((idx) => Math.max(0, (idx ?? 0) - 1));
          }
          break;
        case "Enter":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setShowCheckout(true);
          }
          break;
        case "d":
        case "D":
          if (e.altKey) {
            e.preventDefault();
            setShowDiscount(true);
          }
          break;
        case "l":
        case "L":
          if (e.altKey) {
            e.preventDefault();
            setShowCashLedger(true);
          }
          break;
        case "p":
        case "P":
          if (e.altKey) {
            e.preventDefault();
            setShowPriceCheck(true);
          }
          break;
        case "r":
        case "R":
          if (e.altKey) {
            e.preventDefault();
            setShowReceipts(true);
          }
          break;
        case "q":
        case "Q":
          if (e.altKey) {
            e.preventDefault();
            setShowImportCart(true);
          }
          break;
        case "s":
        case "S":
          if (e.ctrlKey && e.shiftKey) {
            e.preventDefault();
            skuInputRef.current?.focus();
          }
          break;
        case "k":
        case "K":
          if (e.ctrlKey && e.shiftKey) {
            e.preventDefault();
            quantityInputRef.current?.focus();
          }
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", keyDownHandler);
    return () => window.removeEventListener("keydown", keyDownHandler);
  }, [cart.length, selectedCartIdx]);

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
    
    // Check if we're in a new tab (opened from payment)
    const isNewTab = window.opener && !window.opener.closed;

    const finalizeOnlinePayment = async (pendingCartKey, paymentType) => {
      const pending = localStorage.getItem(pendingCartKey);
      if (status === "success" && pending) {
        try {
          const parsed = JSON.parse(pending);
          // finalize checkout using saved items
          (async () => {
            if (hasFinalizedRef.current) return;
            const guardKey = `${paymentType.toLowerCase()}_finalize_done`;
            if (sessionStorage.getItem(guardKey) === "1") return;
            hasFinalizedRef.current = true;
            sessionStorage.setItem(guardKey, "1");
            try {
              setError("");
              const body = {
                items: parsed.items || [],
                payment_type: paymentType.toLowerCase(),
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
                
                // If in new tab, redirect opener and close this tab
                if (isNewTab && window.opener) {
                  window.opener.location.href = url.toString();
                  window.close();
                } else {
                  navigate(url.pathname + url.search);
                }
              } catch (_) {}
            } catch (e) {
              setError(`Failed to record ${paymentType} payment`);
            } finally {
              localStorage.removeItem(pendingCartKey);
              if (!isNewTab) {
                // remove query param
                const url = new URL(window.location.href);
                url.searchParams.delete("payment");
                window.history.replaceState({}, "", url.toString());
              }
            }
          })();
        } catch (_) {
          localStorage.removeItem(pendingCartKey);
        }
      } else if (status === "cancel" && pending) {
        localStorage.removeItem(pendingCartKey);
        // If in new tab, close it; otherwise just clean up URL
        if (isNewTab && window.opener) {
          window.close();
        } else {
          const url = new URL(window.location.href);
          url.searchParams.delete("payment");
          window.history.replaceState({}, "", url.toString());
        }
      }
    };

    finalizeOnlinePayment("pending_gcash_cart", "GCash");
    finalizeOnlinePayment("pending_maya_cart", "Maya");
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
  const handleEditQuantity = (idx, qty) => {
    setCart((prev) =>
      prev.map((item, i) =>
        i === idx ? { ...item, quantity: Math.max(1, qty) } : item
      )
    );
  };

  useEffect(() => {
    if (cart.length === 0) {
      setSelectedCartIdx(0);
    } else {
      setSelectedCartIdx((idx) => Math.min(idx ?? 0, cart.length - 1));
    }
  }, [cart.length]);

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const total =
    appliedDiscount?.type === "percentage"
      ? Math.max(
          0,
          subtotal - subtotal * (Number(appliedDiscount.value || 0) / 100)
        )
      : appliedDiscount?.type === "amount"
      ? Math.max(0, subtotal - Number(appliedDiscount.value || 0))
      : subtotal;

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
        ...(appliedDiscount?.discount_id
          ? { discount_id: appliedDiscount.discount_id }
          : appliedDiscount?.type === "percentage"
          ? { discount_percentage: Number(appliedDiscount.value) }
          : appliedDiscount?.type === "amount"
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
    navigator.clipboard.writeText(user.store_name);
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

  const handleCloseLogoutModal = () => {
    setShowLogoutConfirm(false);
  };

  const headerActions = (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setShowReceipts(true)}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        title="Recent Receipts (Alt+R)"
      >
        <BiReceipt className="w-5 h-5 text-gray-600" />
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
            <span className="text-xs sm:text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-1 rounded-lg">
              Cashier ID: {user?.userId || user?.user_id || user?.id || "N/A"}
            </span>
          </div>
          <div className="flex-1 flex items-center justify-center px-2">
            <button
              onClick={handleCopyTn}
              title="Copy store name"
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
                {user.store_name}
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
                  ref={skuInputRef}
                  sku={sku}
                  setSku={setSku}
                  quantity={quantity}
                  setQuantity={setQuantity}
                  handleAddToCart={handleAddToCart}
                  quantityInputRef={quantityInputRef}
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
                  handleEditQuantity={handleEditQuantity}
                  total={total}
                  subtotal={subtotal}
                  appliedDiscount={appliedDiscount}
                  selectedIdx={selectedCartIdx}
                  onSelectRow={setSelectedCartIdx}
                  className="flex-1 h-full"
                />
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-12 gap-2 sm:gap-3 flex-shrink-0">
                {appliedDiscount && (
                  <div className="col-span-12 flex items-center justify-between bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg px-3 py-2">
                    <span className="text-sm font-semibold">
                      Discount applied: {appliedDiscount.label}
                    </span>
                    <button
                      className="text-xs font-bold underline"
                      onClick={() => setAppliedDiscount(null)}
                    >
                      Remove
                    </button>
                  </div>
                )}
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
                      label="SCAN CUSTOMER QR (F7)"
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
          <div className="mt-3 bg-white/80 border border-gray-200 rounded-xl shadow-sm px-3 py-2 text-[11px] sm:text-xs text-gray-700 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sticky bottom-0">
            <span className="font-semibold text-blue-700">Keyboard Shortcuts</span>
            <span>Ctrl+Shift+S: Focus SKU</span>
            <span>Ctrl+Shift+K: Focus Qty</span>
            <span>Alt+D: Discount</span>
            <span>Alt+P: Price Check</span>
            <span>Alt+L: Cash Ledger</span>
            <span>Alt+Q: Scan Customer QR</span>
            <span>Alt+R: Recent Receipts</span>
            <span>Ctrl+Enter: Checkout</span>
            <span>Delete: Remove selected item</span>
            <span>Arrow Up/Down: Move selection</span>
          </div>
        </main>

        {/* Modals */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-90 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/80 z-90"
              onClick={handleCloseLogoutModal}
            />
            <div className="relative bg-white rounded-xl shadow-xl w-[92%] max-w-md z-100 p-0">
              {/* Header Section */}
              <div className="bg-gradient-to-r from-red-50 via-red-50/80 to-orange-50/50 border-b border-red-100 px-6 py-5 rounded-t-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="white"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900 mb-1">
                      Confirm Logout
                    </h2>
                    <p className="text-sm text-gray-600">
                      Are you sure you want to log out?
                    </p>
                  </div>
                </div>
              </div>

              {/* Content Section */}
              <div className="p-6">
                <p className="text-sm text-gray-700 mb-6">
                  You will be redirected to the login page and your session will
                  end.
                </p>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3">
                  <button
                    onClick={handleCloseLogoutModal}
                    className="px-5 py-2.5 rounded-lg text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmLogout}
                    className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        <DiscountModal
          isOpen={showDiscount}
          onClose={() => setShowDiscount(false)}
          onApplyDiscount={(discount) => {
            setAppliedDiscount(discount);
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
                    window.open(checkoutUrl, '_blank');
                  } catch (e) {
                    setError("Failed to init GCash");
                    localStorage.removeItem("pending_gcash_cart");
                  }
                })();
              } else if (method === "maya") {
                (async () => {
                  try {
                    const successUrl =
                      window.location.origin + "/pos?payment=success";
                    const cancelUrl =
                      window.location.origin + "/pos?payment=cancel";
                    // persist cart to finalize after redirect back
                    localStorage.setItem(
                      "pending_maya_cart",
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
                    const { checkoutUrl } = await createMayaCheckout({
                      amount: Number(total || 0),
                      description: "POS Order",
                      referenceNumber: transactionNumber || `POS-${Date.now()}`,
                      cancelUrl,
                      successUrl,
                    });
                    window.open(checkoutUrl, '_blank');
                  } catch (e) {
                    setError("Failed to init Maya");
                    localStorage.removeItem("pending_maya_cart");
                  }
                })();
              } else {
                // For other payment methods, fall back to existing checkout flow
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
          onImport={async (items, transactionId, completionResponse) => {
            try {
              // If transaction was completed (completionResponse exists), navigate to receipt
              if (completionResponse && transactionId) {
                setCart([]);
                setTransactionId(null);
                setTransactionNumber(null);
                setError("");
                setShowImportCart(false);
                // Navigate to receipt page for cashier
                window.location.href = `/receipt?tn=${completionResponse.transaction_number || transactionId}`;
                return;
              }
              
              // Otherwise, import items (backward compatibility for old QR format)
              if (!items || items.length === 0) {
                setError("No items found in QR code");
                return;
              }
              
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
        <RecentReceiptsModal
          isOpen={showReceipts}
          onClose={() => setShowReceipts(false)}
        />
        <ProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
        />
      </div>
    </div>
  );
}

export default CashierPOS;
