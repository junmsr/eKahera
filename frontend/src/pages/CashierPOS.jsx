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
import QuantityInputModal from "../components/modals/QuantityInputModal";
import ChangePasswordModal from "../components/modals/ChangePasswordModal";
import RecentReceiptsModal from "../components/modals/RecentReceiptsModal";
import { BiReceipt, BiUser } from "react-icons/bi";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";

const ButtonLabel = ({ text, shortcut, variant = "secondary" }) => (
  <div className="flex items-center gap-2">
    <span>{text}</span>
    <span className={`hidden sm:inline-block text-xs font-bold px-1.5 py-0.5 rounded border ${
      variant === "primary" 
        ? "bg-white/20 border-white/40 text-white" 
        : "bg-gray-100 border-gray-300 text-gray-600"
    }`}>
      {shortcut}
    </span>
  </div>
);

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
  
  // Auto-clear error message after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);
  const [showReceipts, setShowReceipts] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const notificationRef = useRef(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const touchStartXRef = useRef(null);
  const touchActiveRef = useRef(false);
  const [selectedCartIdx, setSelectedCartIdx] = useState(0);
  const [editingCartItem, setEditingCartItem] = useState(null);
  const [editQty, setEditQty] = useState('1');
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [pendingProduct, setPendingProduct] = useState(null);
  
  // Set editing cart item and initialize quantity
  const setSelectedCartItem = (idx) => {
    setSelectedCartIdx(idx);
    if (idx >= 0 && idx < cart.length) {
      setEditQty(String(cart[idx].quantity));
    }
  };
  const skuInputRef = useRef(null);
  const quantityInputRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-focus SKU input on initial mount
  useEffect(() => {
    const timer = setTimeout(() => {
      skuInputRef.current?.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const token = sessionStorage.getItem("auth_token");
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
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
                discount_id: parsed.discount_id || null,
                discount_percentage: parsed.discount_percentage || null,
                discount_amount: parsed.discount_amount || null,
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

      // Check if product is weight or volume based - show modal for quantity input
      if (product.product_type === 'weight' || product.product_type === 'volume') {
        setPendingProduct(product);
        setShowQuantityModal(true);
        return;
      }

      // For count-based products, proceed with normal flow
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
      // Auto-focus SKU input after adding item for next scan
      setTimeout(() => {
        skuInputRef.current?.focus();
      }, 50);
    } catch (err) {
      setError("Product not found");
    } finally {
      // Always resume scanner after processing, even on error
      setTimeout(() => {
        setScannerPaused(false);
      }, 300);
    }
  };

  // Handle quantity confirmation from modal
  const handleQuantityConfirm = (quantityInBaseUnits) => {
    if (!pendingProduct) return;
    
    const product = pendingProduct;
    const stockQty = Number(product.stock_quantity ?? 0);
    
    // Check stock
    if (quantityInBaseUnits > stockQty) {
      setError(
        `Insufficient stock. Available: ${stockQty} ${product.base_unit || ''}, requested: ${quantityInBaseUnits} ${product.base_unit || ''}.`
      );
      setShowQuantityModal(false);
      setPendingProduct(null);
      return;
    }

    // Calculate price per base unit for weight/volume products
    let pricePerUnit = Number(product.selling_price || 0);
    if (product.product_type !== 'count' && product.quantity_per_unit && product.quantity_per_unit > 0) {
      // Price per base unit = price per package / quantity per package
      pricePerUnit = pricePerUnit / Number(product.quantity_per_unit);
    }

    // For weight/volume products, quantity is stored in base units
    // Price is stored as price per base unit
    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (i) => i.product_id === product.product_id
      );
      if (existingIdx >= 0) {
        const next = [...prev];
        const existingQty = next[existingIdx].quantity;
        const newQty = existingQty + quantityInBaseUnits;
        if (newQty > stockQty) {
          setError(
            `Insufficient stock. Available: ${stockQty} ${product.base_unit || ''}, requested: ${newQty} ${product.base_unit || ''}.`
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
          quantity: quantityInBaseUnits,
          price: pricePerUnit,
          product_type: product.product_type,
          base_unit: product.base_unit,
          quantity_per_unit: product.quantity_per_unit || 1,
        },
      ];
    });
    
    setSku("");
    setQuantity(1);
    setShowQuantityModal(false);
    setPendingProduct(null);
    
    // Auto-focus SKU input after adding item for next scan
    setTimeout(() => {
      skuInputRef.current?.focus();
    }, 50);
  };

  const handleAddToCart = async () => {
    await addSkuToCart(sku, quantity);
  };

  const handleRemove = (idx) => {
    if (idx >= 0 && idx < cart.length) {
      setCart(cart.filter((_, i) => i !== idx));
    }
  };
  const handleEditQuantity = (idx, qty) => {
    const newQty = qty === '' ? 1 : Math.max(1, Number(qty) || 1);
    setCart((prev) =>
      prev.map((item, i) =>
        i === idx ? { ...item, quantity: newQty } : item
      )
    );
    setEditQty(newQty); // Keep editQty in sync
    setEditingCartItem(null);
  };
  
  // Handle edit quantity change
  const handleEditQtyChange = (value) => {
    setEditQty(value);
  };

  // Handler for increment quantity (=)
  const handleIncrementQuantity = () => {
    if (cart.length === 0 || selectedCartIdx < 0 || selectedCartIdx >= cart.length) return;
    const item = cart[selectedCartIdx];
    if (!item) return;
    const currentQty = item.quantity;
    const newQty = currentQty + 1;
    setCart((prev) =>
      prev.map((cartItem, i) =>
        i === selectedCartIdx ? { ...cartItem, quantity: newQty } : cartItem
      )
    );
  };

  // Handler for decrement quantity (-)
  const handleDecrementQuantity = () => {
    if (cart.length === 0 || selectedCartIdx < 0 || selectedCartIdx >= cart.length) return;
    const item = cart[selectedCartIdx];
    if (!item) return;
    const currentQty = item.quantity;
    if (currentQty <= 1) return; // Don't allow going below 1
    const newQty = currentQty - 1;
    setCart((prev) =>
      prev.map((cartItem, i) =>
        i === selectedCartIdx ? { ...cartItem, quantity: newQty } : cartItem
      )
    );
  };

  // Handle keyboard navigation for cart items
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't handle keys when modals are open
      if (showDiscount || showPriceCheck || showImportCart || showCashLedger || showCheckout || showCashModal || showReceipts || showChangePasswordModal || showLogoutConfirm) {
        return;
      }

      // Don't handle if user is typing in an input field (unless it's specific navigation keys)
      const isInputFocused = e.target && (
        e.target.tagName === 'INPUT' || 
        e.target.tagName === 'TEXTAREA' ||
        e.target.isContentEditable
      );

      // Only handle navigation keys if not in input or if editing cart item
      const navigationKeys = ['ArrowUp', 'ArrowDown', 'Enter', 'Escape'];
      const editKeys = ['e', 'E', 'd', 'D'];
      const quantityKeys = ['=', '-'];
      
      if (isInputFocused && editingCartItem === null && !navigationKeys.includes(e.key) && !editKeys.includes(e.key) && !quantityKeys.includes(e.key)) {
        return;
      }

      // Handle Escape key for editing state (but let shortcut handler handle modal closing)
      if (e.key === 'Escape' && editingCartItem !== null) {
        e.preventDefault();
        e.stopPropagation();
        setEditingCartItem(null);
        return;
      }

      // Handle Enter key for editing state
      if (e.key === 'Enter' && editingCartItem !== null) {
        e.preventDefault();
        e.stopPropagation();
        handleEditQuantity(editingCartItem, editQty);
        setEditingCartItem(null);
        return;
      }

      // Handle arrow keys - allow navigation even when SKU input is focused
      const isSkuInput = e.target === skuInputRef.current;
      const isArrowKey = e.key === 'ArrowUp' || e.key === 'ArrowDown';
      const isQuantityKey = e.key === '=' || e.key === '-';
      
      if (isArrowKey && (isSkuInput || !isInputFocused || editingCartItem !== null)) {
        switch (e.key) {
          case 'ArrowUp':
          e.preventDefault();
          e.stopPropagation();
          setSelectedCartIdx(prev => prev > 0 ? prev - 1 : cart.length - 1);
          break;
          case 'ArrowDown':
          e.preventDefault();
          e.stopPropagation();
          setSelectedCartIdx(prev => prev < cart.length - 1 ? prev + 1 : 0);
          break;
          // E and D keys removed - now using F1 and F2 instead
          default:
            break;
        }
      }
      
      // Handle quantity keys (= and -) even when SKU input is focused
      if (isQuantityKey && (isSkuInput || !isInputFocused || editingCartItem !== null)) {
        if (cart.length > 0 && selectedCartIdx >= 0 && selectedCartIdx < cart.length) {
          if (e.key === '=') {
            e.preventDefault();
            e.stopPropagation();
            handleIncrementQuantity();
          } else if (e.key === '-') {
            e.preventDefault();
            e.stopPropagation();
            handleDecrementQuantity();
          }
        }
      }
    };

    // Use bubble phase (after shortcuts hook which uses capture)
    window.addEventListener('keydown', handleKeyDown, false);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, false);
    };
  }, [cart.length, selectedCartIdx, editingCartItem, editQty, showDiscount, showPriceCheck, showImportCart, showCashLedger, showCheckout, showCashModal, showReceipts, showChangePasswordModal, showLogoutConfirm, handleIncrementQuantity, handleDecrementQuantity]);

  // Reset selected index when cart changes
  useEffect(() => {
    if (cart.length === 0) {
      setSelectedCartIdx(0);
    } else {
      setSelectedCartIdx(prev => Math.min(prev, cart.length - 1));
    }
  }, [cart.length]);


  // Pause scanner when any modal is open to avoid hardware scanner/keyboard events interfering with shortcuts
  useEffect(() => {
    const anyModalOpen =
      showDiscount ||
      showPriceCheck ||
      showImportCart ||
      showCashLedger ||
      showCheckout ||
      showCashModal ||
      showReceipts ||
      showChangePasswordModal ||
      showLogoutConfirm;
    
    setScannerPaused(anyModalOpen);
    
    // When modals close, refocus SKU input after a delay (but not if user is interacting with other elements)
    if (!anyModalOpen) {
      const timer = setTimeout(() => {
        const activeElement = document.activeElement;
        const isInputFocused = activeElement && (
          activeElement.tagName === 'INPUT' || 
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.isContentEditable ||
          activeElement.tagName === 'BUTTON'
        );
        // Only refocus if user isn't actively clicking buttons or using inputs
        if (!isInputFocused && document.body === activeElement) {
          skuInputRef.current?.focus();
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [
    showDiscount,
    showPriceCheck,
    showImportCart,
    showCashLedger,
    showCheckout,
    showCashModal,
    showReceipts,
    showChangePasswordModal,
    showLogoutConfirm,
  ]);

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  
  // Calculate total with discount
  let total = subtotal;
  if (appliedDiscount) {
    if (appliedDiscount.type === "percentage") {
      const discountValue = Number(appliedDiscount.value);
      if (!isNaN(discountValue) && discountValue > 0) {
        const discountAmount = subtotal * (discountValue / 100);
        total = Math.max(0, subtotal - discountAmount);
      } else {
        console.warn("Invalid discount value:", appliedDiscount.value, "for discount:", appliedDiscount);
      }
    } else if (appliedDiscount.type === "amount") {
      const discountValue = Number(appliedDiscount.value);
      if (!isNaN(discountValue) && discountValue > 0) {
        total = Math.max(0, subtotal - discountValue);
      } else {
        console.warn("Invalid discount value:", appliedDiscount.value, "for discount:", appliedDiscount);
      }
    }
  }

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
        discount_id: appliedDiscount?.discount_id || null,
        discount_percentage: appliedDiscount?.type === "percentage" ? Number(appliedDiscount.value) : null,
        discount_amount: appliedDiscount?.type === "amount" ? Number(appliedDiscount.value) : null,
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
      // Extract error message from response if available
      const errorMessage = err?.response?.data?.error || err?.data?.error || err?.message || "Checkout failed";
      setError(errorMessage);
    }
  };

  const handleCopyTn = () => {
    navigator.clipboard.writeText(user.store_name);
  };

  const focusSkuInput = () => {
    skuInputRef.current?.focus();
    skuInputRef.current?.select?.();
  };

  const focusQuantityInput = () => {
    quantityInputRef.current?.focus();
    quantityInputRef.current?.select?.();
  };

  const handleNewTransaction = () => {
    setCart([]);
    setAppliedDiscount(null);
    setTransactionId(null);
    setError("");
    focusSkuInput();
  };

  const handleVoidSelected = () => {
    if (cart.length === 0 || selectedCartIdx == null || selectedCartIdx < 0 || selectedCartIdx >= cart.length) return;
    handleRemove(selectedCartIdx);
  };

  const handleSetQuantityShortcut = () => {
    if (cart.length === 0 || selectedCartIdx == null) return;
    const current = cart[selectedCartIdx];
    const nextQty = Number(
      window.prompt(
        `Set quantity for ${current.name || current.sku}:`,
        current.quantity
      )
    );
    if (!Number.isNaN(nextQty) && nextQty > 0) {
      handleEditQuantity(selectedCartIdx, nextQty);
    }
  };

  const handleRemoveDiscount = () => {
    if (appliedDiscount) {
      setAppliedDiscount(null);
    }
  };

  // Handler for edit quantity (F1)
  const handleEditQuantityShortcut = () => {
    if (cart.length > 0 && selectedCartIdx >= 0 && selectedCartIdx < cart.length) {
      setEditingCartItem(selectedCartIdx);
      setEditQty(String(cart[selectedCartIdx].quantity));
    }
  };

  // Handler for discount modal toggle (F6) - open/close discount modal
  const handleDiscountToggle = () => {
    setShowDiscount(!showDiscount);
  };

  const handleUnavailable = (message) => {
    setError(message);
    notificationRef.current?.scrollIntoView?.({ behavior: "smooth" });
  };

  useKeyboardShortcuts(
    [
      // ` (backtick) - focus SKU field
      { key: "`", action: focusSkuInput },
      // F1 - edit product quantity
      {
        key: "f1",
        action: handleEditQuantityShortcut,
        enabled: cart.length > 0 && selectedCartIdx >= 0,
      },
      // F2 - delete item
      {
        key: "f2",
        action: handleVoidSelected,
        enabled: cart.length > 0 && selectedCartIdx >= 0 && selectedCartIdx < cart.length,
      },
      // F3 - logout
      {
        key: "f3",
        description: "Logout",
        action: () => setShowLogoutConfirm(true),
      },
      // F4 - add to cart button
      {
        key: "f4",
        action: handleAddToCart,
        enabled: !!sku, // Only enable if there's a SKU value
      },
      // F5 - cash ledger
      { key: "f5", action: () => setShowCashLedger(true) },
      // F6 - open/close discount modal
      {
        key: "f6",
        action: handleDiscountToggle,
      },
      // F7 - price check
      {
        key: "f7",
        description: "Price Check",
        action: () => {
          setShowPriceCheck(true);
        },
      },
      // F8 - scan customer cart (keep existing)
      {
        key: "f8",
        description: "Scan Customer Cart",
        action: () => setShowImportCart(true),
      },
      // F9 - receipts
      {
        key: "f9",
        description: "Receipts",
        action: () => setShowReceipts(true),
      },
      // F10 - change password
      {
        key: "f10",
        description: "Change Password",
        action: () => setShowChangePasswordModal(true),
      },
      // F11 - remove discount
      {
        key: "f11",
        action: handleRemoveDiscount,
        enabled: !!appliedDiscount,
      },
      // F12 - checkout
      {
        key: "f12",
        description: "Checkout",
        action: () => setShowCheckout(true),
        enabled: cart.length > 0,
      },
      // = (equals) - increment quantity
      {
        key: "=",
        action: handleIncrementQuantity,
        enabled: cart.length > 0 && selectedCartIdx >= 0 && selectedCartIdx < cart.length,
      },
      // - (minus) - decrement quantity
      {
        key: "-",
        action: handleDecrementQuantity,
        enabled: cart.length > 0 && selectedCartIdx >= 0 && selectedCartIdx < cart.length,
      },
      {
        key: "escape",
        description: "Close Open Modals",
        action: () => {
          // Only close modals, don't interfere with cart editing (handled separately)
          if (showCheckout) setShowCheckout(false);
          else if (showDiscount) setShowDiscount(false);
          else if (showPriceCheck) setShowPriceCheck(false);
          else if (showImportCart) setShowImportCart(false);
          else if (showCashModal) setShowCashModal(false);
          else if (showCashLedger) setShowCashLedger(false);
          else if (showReceipts) setShowReceipts(false);
          else if (showChangePasswordModal) setShowChangePasswordModal(false);
          else if (showLogoutConfirm) setShowLogoutConfirm(false);
          // Note: Cart item editing escape is handled in the separate keyboard handler
        },
        allowWhileTyping: true,
        stopPropagation: false, // Allow other handlers to process
      },
    ],
    [
      cart.length,
      selectedCartIdx,
      sku,
      appliedDiscount,
      showCheckout,
      showDiscount,
      showPriceCheck,
      showImportCart,
      showCashModal,
      showCashLedger,
      showReceipts,
      showChangePasswordModal,
      showLogoutConfirm,
    ]
  );

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

  // Handle keyboard events for logout confirmation
  useEffect(() => {
    if (!showLogoutConfirm) return;

    const handleKeyDown = (e) => {
      // Use stopPropagation to prevent other handlers from interfering
      e.stopPropagation();
      
      if (e.key === 'Escape' || e.key === 'Esc') {
        e.preventDefault();
        handleCloseLogoutModal();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        confirmLogout();
      }
    };

    // Use capture phase to ensure we get the event first
    document.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => document.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [showLogoutConfirm]);

  const headerActions = (
    <div className="flex items-center gap-2">
      <div className="hidden md:block text-right mr-2">
        <div className="text-xs text-gray-500 font-medium">
          {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
        <div className="text-sm font-bold text-gray-700">
          {currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
        </div>
      </div>
      <button
        onClick={() => setShowReceipts(true)}
        className="flex items-center gap-2 bg-white/80 backdrop-blur-sm p-1.5 sm:px-3 sm:py-2 rounded-lg border border-gray-200/80 hover:bg-gray-50 transition-colors group relative"
        title="View all receipts (F9)"
      >
        <div className="relative">
          <BiReceipt className="w-5 h-5 text-blue-600" />
        </div>
        <span className="text-sm font-medium text-gray-700 hidden sm:inline">
          Receipts
        </span>
        <span className="hidden sm:inline-block bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold px-1.5 py-0.5 rounded">
          F9
        </span>
      </button>
      <button
        onClick={() => setShowChangePasswordModal(true)}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
        title="Change Password (F10)"
      >
        <BiUser className="w-5 h-5 text-gray-600" />
        <span className="hidden sm:inline-block bg-gray-100 text-gray-600 border border-gray-200 text-xs font-bold px-1.5 py-0.5 rounded">F10</span>
      </button>
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-2 rounded-lg hover:bg-red-50 transition-colors"
        title="Logout (F3)"
      >
        <div className="relative">
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
        </div>
        <span className="text-sm font-medium text-gray-700 hidden sm:inline">Logout</span>
        <span className="hidden sm:inline-block bg-red-100 text-red-700 border border-red-200 text-[11px] font-bold rounded px-1.5 py-0.5">
          F3
        </span>
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
                  <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-3 flex items-start gap-2 mt-3 relative animate-in slide-in-from-top-2 duration-300">
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
                    <p className="text-sm font-medium text-red-700 flex-1">
                      {(() => {
                        try {
                          const parsed = JSON.parse(error);
                          return parsed.error || parsed.message || error;
                        } catch {
                          return error;
                        }
                      })()}
                    </p>
                    <button
                      onClick={() => setError("")}
                      className="text-red-400 hover:text-red-600 transition-colors flex-shrink-0 ml-2"
                      aria-label="Dismiss error"
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
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
                  handleEditQuantity={(idx, newQuantity) => {
                    const updatedCart = [...cart];
                    updatedCart[idx].quantity = newQuantity;
                    setCart(updatedCart);
                    setEditingCartItem(null);
                  }}
                  total={total}
                  appliedDiscount={appliedDiscount}
                  selectedIdx={selectedCartIdx}
                  onSelectRow={setSelectedCartItem}
                  editingIdx={editingCartItem}
                  editQty={editQty}
                  onEditQtyChange={handleEditQtyChange}
                  onEditComplete={() => setEditingCartItem(null)}
                  onStartEdit={(idx) => setEditingCartItem(idx)}
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
                      className="text-xs font-bold underline flex items-center gap-1"
                      onClick={() => setAppliedDiscount(null)}
                    >
                      <span className="text-yellow-600">(F11)</span> Remove
                    </button>
                  </div>
                )}
                {/* Grouped Buttons */}
                <div className="col-span-8">
                  <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 sm:gap-3">
                    <Button
                      label={<ButtonLabel text="CASH LEDGER" shortcut="F5" />}
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
                    <div className="relative group w-full">
                      <Button
                        label={
                          appliedDiscount
                            ? <ButtonLabel text="REMOVE DISCOUNT" shortcut="F11" variant="secondary" />
                            : <ButtonLabel text="DISCOUNT" shortcut="F6" />
                        }
                        size="md"
                        className="w-full h-10 sm:h-12 text-xs sm:text-sm font-bold"
                        onClick={() => {
                          if (appliedDiscount) {
                            if (window.confirm(`Remove ${appliedDiscount.label || 'discount'}?`)) {
                              setAppliedDiscount(null);
                            }
                          } else {
                            setShowDiscount(true);
                          }
                        }}
                        variant="secondary"
                        microinteraction
                        icon={
                          appliedDiscount ? (
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
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          ) : (
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
                          )
                        }
                        iconPosition="left"
                      />
                      {appliedDiscount && (
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          Click to remove discount
                          <div className="absolute bottom-0 left-1/2 w-2 h-2 bg-gray-800 transform -translate-x-1/2 translate-y-1/2 rotate-45"></div>
                        </div>
                      )}
                    </div>
                    <Button
                      label={<ButtonLabel text="PRICE CHECK" shortcut="F7" />}
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
                      label={<ButtonLabel text="SCAN CUSTOMER QR" shortcut="F8" />}
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
                    label={<ButtonLabel text="CHECKOUT" shortcut="F12" variant="primary" />}
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
          <div className="fixed inset-0 z-90 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/80 z-90"
              onClick={handleCloseLogoutModal}
            />
            <div 
              className="relative bg-white rounded-xl shadow-xl w-[92%] max-w-md z-100 p-0"
              onKeyDown={(e) => {
                // Prevent event from bubbling up to document
                e.stopPropagation();
                
                // Handle Enter key specifically for the modal
                if (e.key === 'Enter' && !e.isPropagationStopped()) {
                  e.preventDefault();
                  confirmLogout();
                }
              }}
            >
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
                      Are you sure you want to log out? <span className="text-xs opacity-70">(Press Esc to cancel, Enter to confirm)</span>
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
                    className="px-5 py-2.5 rounded-lg text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    autoFocus
                  >
                    Cancel (Esc)
                  </button>
                  <button
                    onClick={confirmLogout}
                    className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
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
                    Logout (Enter)
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
                        discount_id: appliedDiscount?.discount_id || null,
                        discount_percentage: appliedDiscount?.type === "percentage" ? Number(appliedDiscount.value) : null,
                        discount_amount: appliedDiscount?.type === "amount" ? Number(appliedDiscount.value) : null,
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
                        discount_id: appliedDiscount?.discount_id || null,
                        discount_percentage: appliedDiscount?.type === "percentage" ? Number(appliedDiscount.value) : null,
                        discount_amount: appliedDiscount?.type === "amount" ? Number(appliedDiscount.value) : null,
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
        <QuantityInputModal
          isOpen={showQuantityModal}
          onClose={() => {
            setShowQuantityModal(false);
            setPendingProduct(null);
            // Auto-focus SKU input after closing modal
            setTimeout(() => {
              skuInputRef.current?.focus();
            }, 50);
          }}
          product={pendingProduct}
          onConfirm={handleQuantityConfirm}
          existingQuantity={
            pendingProduct
              ? cart.find((item) => item.product_id === pendingProduct.product_id)
                  ?.quantity || 0
              : 0
          }
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
        <ChangePasswordModal
          isOpen={showChangePasswordModal}
          onClose={() => setShowChangePasswordModal(false)}
        />
      </div>
    </div>
  );
}

export default CashierPOS;
