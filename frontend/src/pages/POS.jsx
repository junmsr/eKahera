import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ScannerCard from "../components/ui/POS/ScannerCard";
import PageLayout from "../components/layout/PageLayout";
import SkuFormCard from "../components/ui/POS/SkuFormCard";
import CartTableCard from "../components/ui/POS/CartTableCard";
import Button from "../components/common/Button";
import NavAdmin from "../components/layout/Nav-Admin";
// Background gradient removed for a neutral look
import { api, createGcashCheckout, createMayaCheckout } from "../lib/api";
import PriceCheckModal from "../components/modals/PriceCheckModal";
import DiscountModal from "../components/modals/DiscountModal";
import CashLedgerModal from "../components/modals/CashLedgerModal";
import CheckoutModal from "../components/modals/CheckoutModal";
import CashPaymentModal from "../components/modals/CashPaymentModal";
import ScanCustomerCartModal from "../components/modals/ScanCustomerCartModal";
import ProfileModal from "../components/modals/ProfileModal";
import NotificationDropdown from "../components/common/NotificationDropdown";
import { BiBell, BiSync, BiUser } from "react-icons/bi";
import { MdClose } from "react-icons/md";

function POS() {
  const navigate = useNavigate();

  // States
  const [sku, setSku] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState([]);
  const [showDiscount, setShowDiscount] = useState(false);
  const [showPriceCheck, setShowPriceCheck] = useState(false);
  const [priceCheckSku, setPriceCheckSku] = useState("");
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
  const skuInputRef = useRef(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [selectedItemIdx, setSelectedItemIdx] = useState(-1);
  const [editingIdx, setEditingIdx] = useState(null);
  const token = sessionStorage.getItem("auth_token");
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  const hasFinalizedRef = React.useRef(false);
  const [businessName, setBusinessName] = useState("");

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
    const businessId = user?.businessId || user?.business_id;

    // Check if we're in a new tab (opened from payment)
    const isNewTab = window.opener && !window.opener.closed;

    const finalizeOnlinePayment = async (pendingCartKey, paymentType) => {
      const pending = localStorage.getItem(pendingCartKey);
      if (status === "success" && pending && businessId) {
        try {
          const parsed = JSON.parse(pending);
          if (hasFinalizedRef.current) return;
          const guardKey = `${paymentType}_finalize_done`;
          if (sessionStorage.getItem(guardKey) === "1") return;
          hasFinalizedRef.current = true;
          sessionStorage.setItem(guardKey, "1");
          try {
            setError("");
            const body = {
              items: parsed.items || [],
              payment_type: paymentType.toLowerCase(),
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
                window.location.href = url.toString();
              }
            } catch (_) {}
          } catch (e) {
            setError(`Failed to record ${paymentType} payment`);
          } finally {
            localStorage.removeItem(pendingCartKey);
            if (!isNewTab) {
              const url = new URL(window.location.href);
              url.searchParams.delete("payment");
              window.history.replaceState({}, "", url.toString());
            }
          }
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
      setError("Product not found");
    }
  };

  const handleAddToCart = async () => {
    await addSkuToCart(sku, quantity);
  };

  const handleRemove = (idx) => setCart(cart.filter((_, i) => i !== idx));

  const handleEditQuantity = async (idx, newQty) => {
    if (newQty < 1) {
      setError("Quantity must be at least 1");
      return;
    }
    const item = cart[idx];
    if (!item) return;
    setError("");
    try {
      const product = await api(
        `/api/products/sku/${encodeURIComponent(item.sku)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const stockQty = Number(product.stock_quantity ?? 0);
      if (newQty > stockQty) {
        setError(
          `Insufficient stock. Available: ${stockQty}, requested: ${newQty}.`
        );
        return;
      }
      setCart((prev) =>
        prev.map((it, i) => (i === idx ? { ...it, quantity: newQty } : it))
      );
    } catch (err) {
      setError(err.message || "Failed to update quantity");
    }
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Placeholder for appliedDiscount state and discount calculation if needed
  // const [appliedDiscount, setAppliedDiscount] = useState(null);
  // const total = calculateTotalWithDiscount(subtotal, appliedDiscount);
  // For now, total equals subtotal
  const total = subtotal;

  const handleCheckout = async (paymentMethod, amountReceived = null) => {
    if (cart.length === 0) return;
    setError("");
    try {
      // Prepare the checkout payload
      const payload = {
        items: cart.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
        })),
        payment_type: paymentMethod,
        money_received: amountReceived,
        transaction_id: transactionId, // Include the transaction ID if it exists
        transaction_number: transactionNumber,
      };

      const resp = await api("/api/sales/checkout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
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
      console.error("Checkout error:", err);
      setError("Checkout failed");
    }
  };

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const getReadNotifIds = () => {
    try {
      return JSON.parse(sessionStorage.getItem("read_notif_ids") || "[]");
    } catch (e) {
      return [];
    }
  };

  const fetchNotifications = async () => {
    try {
      const resp = await api("/api/logs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const readIds = new Set(getReadNotifIds());
      const deletedIds = new Set(
        JSON.parse(sessionStorage.getItem("deleted_notif_ids") || "[]")
      );
      const mapped = (resp || [])
        .filter((log) => !deletedIds.has(log.log_id))
        .map((log) => ({
          id: log.log_id,
          title: log.action,
          message: `${log.username} (${log.role}) did an action: ${log.action}`,
          time: new Date(log.date_time).toLocaleString(),
          isRead: readIds.has(log.log_id),
        }));
      setNotifications(mapped);
      setUnreadCount(mapped.filter((n) => !n.isRead).length);
    } catch (e) {
      console.error("Failed to fetch notifications", e);
    }
  };

  const handleMarkAsRead = (id) => {
    const readIds = getReadNotifIds();
    if (!readIds.includes(id)) {
      sessionStorage.setItem(
        "read_notif_ids",
        JSON.stringify([...readIds, id])
      );
    }
    setNotifications((notifs) =>
      notifs.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const handleMarkAsUnread = (id) => {
    const readIds = getReadNotifIds();
    const filtered = readIds.filter((rid) => rid !== id);
    sessionStorage.setItem("read_notif_ids", JSON.stringify(filtered));
    setNotifications((notifs) =>
      notifs.map((n) => (n.id === id ? { ...n, isRead: false } : n))
    );
    setUnreadCount((c) => c + 1);
  };

  const handleDeleteNotification = (id) => {
    const deletedIds = JSON.parse(
      sessionStorage.getItem("deleted_notif_ids") || "[]"
    );
    sessionStorage.setItem(
      "deleted_notif_ids",
      JSON.stringify([...deletedIds, id])
    );
    setNotifications((notifs) => notifs.filter((n) => n.id !== id));
    // Update unread count if deleted notification was unread
    const notif = notifications.find((n) => n.id === id);
    if (notif && !notif.isRead) {
      setUnreadCount((c) => Math.max(0, c - 1));
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Fetch business name
  useEffect(() => {
    const fetchBusinessName = async () => {
      try {
        const resp = await api("/api/business/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (resp?.business?.business_name) {
          setBusinessName(resp.business.business_name);
        }
      } catch (e) {
        console.error("Failed to fetch business name", e);
      }
    };
    if (token) {
      fetchBusinessName();
    }
  }, [token]);

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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check if an input is focused
      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA" ||
          activeElement.contentEditable === "true");

      // Handle Enter globally for adding to cart
      if (e.key === "Enter") {
        e.preventDefault();
        handleAddToCart();
        return;
      }

      // If input is focused, skip other shortcuts
      if (isInputFocused) {
        return;
      }

      // Handle shortcuts
      switch (e.key) {
        case "F1":
          e.preventDefault();
          if (skuInputRef.current) {
            skuInputRef.current.focus();
          }
          break;
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
        case "F9":
          e.preventDefault();
          if (cart.length > 0) {
            const idx =
              selectedItemIdx >= 0 && selectedItemIdx < cart.length
                ? selectedItemIdx
                : 0;
            setSelectedItemIdx(idx);
            setEditingIdx(idx);
          }
          break;
        case "Delete":
          if (e.shiftKey) {
            e.preventDefault();
            setCart([]);
            setSelectedItemIdx(-1);
          } else {
            e.preventDefault();
            if (selectedItemIdx >= 0 && selectedItemIdx < cart.length) {
              handleRemove(selectedItemIdx);
              if (selectedItemIdx >= cart.length - 1) {
                setSelectedItemIdx(Math.max(-1, cart.length - 2));
              }
            }
          }
          break;
        case "Escape":
          e.preventDefault();
          if (
            showDiscount ||
            showPriceCheck ||
            showCashLedger ||
            showImportCart ||
            showCheckout ||
            showCashModal ||
            showProfileModal
          ) {
            setShowDiscount(false);
            setShowPriceCheck(false);
            setShowCashLedger(false);
            setShowImportCart(false);
            setShowCheckout(false);
            setShowCashModal(false);
            setShowProfileModal(false);
          } else {
            setSku("");
            setQuantity(1);
            if (skuInputRef.current) {
              skuInputRef.current.focus();
            }
          }
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedItemIdx((prev) => Math.max(-1, prev - 1));
          break;
        case "ArrowDown":
          e.preventDefault();
          setSelectedItemIdx((prev) => Math.min(cart.length - 1, prev + 1));
          break;
        default:
          break;
      }

      // Handle numpad + and -
      if (e.location === KeyboardEvent.DOM_KEY_LOCATION_NUMPAD) {
        if (e.key === "+") {
          e.preventDefault();
          if (selectedItemIdx >= 0 && selectedItemIdx < cart.length) {
            const newQty = cart[selectedItemIdx].quantity + 1;
            handleEditQuantity(selectedItemIdx, newQty);
          }
        } else if (e.key === "-") {
          e.preventDefault();
          if (selectedItemIdx >= 0 && selectedItemIdx < cart.length) {
            const newQty = Math.max(1, cart[selectedItemIdx].quantity - 1);
            handleEditQuantity(selectedItemIdx, newQty);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    cart,
    selectedItemIdx,
    showDiscount,
    showPriceCheck,
    showCashLedger,
    showImportCart,
    showCheckout,
    showCashModal,
    showProfileModal,
  ]);

  const handleCopyTn = async () => {
    try {
      if (!user.store_name) return;
      await navigator.clipboard.writeText(user.store_name);
    } catch (_) {}
  };

  const headerActions = (
    <div className="flex items-center gap-1 sm:gap-4 mr-3">
      {/* Transaction Number display */}
      <div className="flex-1 flex items-center justify-center">
        <button
          onClick={handleCopyTn}
          title="Copy store name"
          className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg px-2 py-1.5 sm:px-2.5 shadow-sm"
        >
          <svg
            className="w-3 h-3 sm:w-4 sm:h-4"
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
          <span className="font-mono text-xs sm:text-sm font-bold tracking-wider truncate max-w-[30vw] sm:max-w-[50vw]">
            {user.store_name}
          </span>
        </button>
      </div>
      {/* Notification Button with Dropdown */}
      <div className="relative" ref={notificationRef}>
        <NotificationDropdown
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkAsRead={handleMarkAsRead}
          onMarkAsUnread={handleMarkAsUnread}
          onDelete={handleDeleteNotification}
          isOpen={showNotifications}
          onToggle={() => setShowNotifications(!showNotifications)}
          containerRef={notificationRef}
        />
      </div>
    </div>
  );

  return (
    <PageLayout
      title={businessName ? `${businessName} - POS` : "POS"}
      sidebar={<NavAdmin />}
      headerActions={headerActions}
      isSidebarOpen={isSidebarOpen}
      setSidebarOpen={setSidebarOpen}
    >
      <div className="flex-1 flex flex-col min-h-screen">
        <main className="flex-1 bg-gradient-to-br from-gray-50/50 via-blue-50/30 to-indigo-50/50 overflow-hidden p-2 sm:p-3 md:p-4 pb-10 lg:pb-4">
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
                      await addSkuToCart(code, 1);
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

              {/* TransactionCard */}
              {/* Removed card display; transaction number now shown in header */}
              {/* <div className="flex-shrink-0">
                  <TransactionCard
                    transactionNumber={transactionNumber}
                    transactionId={transactionId}
                  />
                </div> */}
            </div>

            {/* Right Column - Cart and Actions */}
            <div className="lg:col-span-8 flex flex-col gap-2 sm:gap-3 min-h-0">
              {/* CartTableCard */}
              <div className="flex-1 min-h-0 max-h-[calc(100vh-280px)]">
                <CartTableCard
                  cart={cart}
                  handleRemove={handleRemove}
                  handleEditQuantity={handleEditQuantity}
                  total={total}
                  className="flex-1 h-full"
                  selectedItemIdx={selectedItemIdx}
                  editingIdx={editingIdx}
                  setEditingIdx={setEditingIdx}
                  onSelectItem={setSelectedItemIdx}
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
      </div>
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
          } else if (method === "gcash") {
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
                  referenceNumber: transactionNumber || `POS-${Date.now()}`,
                  cancelUrl,
                  successUrl,
                });
                window.open(checkoutUrl, "_blank");
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
                  })
                );
                const { checkoutUrl } = await createMayaCheckout({
                  amount: Number(total || 0),
                  description: "POS Order",
                  referenceNumber: transactionNumber || `POS-${Date.now()}`,
                  cancelUrl,
                  successUrl,
                });
                window.open(checkoutUrl, "_blank");
              } catch (e) {
                setError("Failed to init Maya");
                localStorage.removeItem("pending_maya_cart");
              }
            })();
          } else {
            handleCheckout(method);
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
        onImport={(items, transactionId) => {
          // If we have a transaction ID from the scanned cart, use it
          if (transactionId) {
            setTransactionId(transactionId);
          }

          // Merge imported items into current cart
          setCart((prev) => {
            const bySku = new Map(prev.map((i) => [i.sku, i]));
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
    </PageLayout>
  );
}

export default POS;
