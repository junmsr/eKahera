import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Background from "../../layout/Background";
import ScannerCard from "../../ui/POS/ScannerCard";
import Card from "../../common/Card";
import OrderDrawer from "./OrderDrawer";
import CheckoutModal from "./CheckoutModal";
import ActionBar from "./ActionBar";
import { api, createGcashCheckout } from "../../../lib/api";
import CustomerCartQRModal from "../../modals/CustomerCartQRModal";

function MobileScannerView() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [scannerPaused, setScannerPaused] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("GCash");
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState("");
  const [error, setError] = useState("");
  const [showCartQR, setShowCartQR] = useState(false);
  const hasFinalizedRef = useRef(false);

  const [qrPayload, setQrPayload] = useState(null);
  const [transactionId, setTransactionId] = useState(null);

  const total = useMemo(
    () =>
      cart.reduce(
        (sum, item) =>
          item &&
          typeof item.price === "number" &&
          typeof item.quantity === "number"
            ? sum + item.price * item.quantity
            : sum,
        0
      ),
    [cart]
  );

  // Handle return from online payment (GCash)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("payment");
    const pending = localStorage.getItem("pending_gcash_cart_public");
    const businessId = localStorage.getItem("business_id");
    if (status === "success" && pending && businessId) {
      try {
        const parsed = JSON.parse(pending);
        (async () => {
          if (hasFinalizedRef.current) return;
          const guardKey = "gcash_finalize_done_public";
          if (sessionStorage.getItem(guardKey) === "1") return;
          hasFinalizedRef.current = true;
          sessionStorage.setItem(guardKey, "1");
          try {
            const body = {
              items: parsed.items || [],
              payment_type: "gcash",
              money_received: parsed.total || null,
              business_id: Number(businessId),
              transaction_number: parsed.transactionNumber || null,
            };
            const resp = await api("/api/sales/public/checkout", {
              method: "POST",
              body: JSON.stringify(body),
            });
            setCart([]);
            const url = new URL(window.location.origin + "/receipt");
            url.searchParams.set("tn", resp.transaction_number);
            url.searchParams.set("tid", String(resp.transaction_id));
            url.searchParams.set("total", String(resp.total || 0));
            window.location.href = url.toString();
          } catch (e) {
            setError(e.message || "Failed to record payment");
          } finally {
            localStorage.removeItem("pending_gcash_cart_public");
            const url = new URL(window.location.href);
            url.searchParams.delete("payment");
            window.history.replaceState({}, "", url.toString());
          }
        })();
      } catch (_) {
        localStorage.removeItem("pending_gcash_cart_public");
      }
    }
  }, []);

  const handleScan = async (result) => {
    const code = result?.[0]?.rawValue;
    if (!code) return;

    setScannerPaused(true);
    setError("");
    setLoading(true);

    try {
      // Check if product already exists in cart
      const existingIndex = cart.findIndex((p) => p.sku === code);
      if (existingIndex !== -1) {
        // Just increment quantity for existing item
        setCart((prev) => {
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: updated[existingIndex].quantity + 1,
          };
          return updated;
        });
        setScannerPaused(false);
        return;
      }

      // Fetch product from database using public endpoint
      // Prefer stored business_id if available; backend now also supports fallback without it
      const storedBusinessId = localStorage.getItem("business_id");
      const query = storedBusinessId
        ? `?business_id=${encodeURIComponent(storedBusinessId)}`
        : "";
      const product = await api(
        `/api/products/public/sku/${encodeURIComponent(code)}${query}`
      );

      // Enforce that scanned product belongs to the current store
      if (
        product &&
        (!storedBusinessId ||
          Number(product.business_id) === Number(storedBusinessId))
      ) {
        const price = Number(product.selling_price || 0);
        const productName = product.product_name || `Product ${code}`;

        setCart((prev) => [
          ...prev,
          {
            product_id: product.product_id,
            sku: product.sku,
            name: productName,
            quantity: 1,
            price: price,
          },
        ]);
      } else {
        throw new Error("Product not found in this store");
      }
    } catch (err) {
      setError(err.message || "Product not found");
      console.error("Error fetching product:", err);
    } finally {
      setLoading(false);
      setScannerPaused(false);
    }
  };

  const increment = (sku) =>
    setCart((prev) =>
      prev.map((p) => (p.sku === sku ? { ...p, quantity: p.quantity + 1 } : p))
    );
  const decrement = (sku) =>
    setCart((prev) =>
      prev.map((p) =>
        p.sku === sku ? { ...p, quantity: Math.max(1, p.quantity - 1) } : p
      )
    );
  const removeItem = (sku) =>
    setCart((prev) => prev.filter((p) => p.sku !== sku));

  const handleCopyTn = () => {
    const storedTxn = localStorage.getItem("provisionalTransactionNumber");
    navigator.clipboard.writeText(storedTxn || "");
  };

  const handleTransactionComplete = (tn) => {
    setShowCartQR(false);
    navigate(`/receipt?tn=${tn}&from=customer`);
  };

  return (
    <Background variant="gradientBlue" pattern="dots" floatingElements overlay>
      {/* Animated background orbs */}
      <motion.div
        className="absolute -top-24 -left-24 w-[28rem] h-[28rem] rounded-full bg-gradient-to-br from-blue-400/15 to-cyan-400/10 blur-3xl"
        animate={{ scale: [1, 1.08, 1], opacity: [0.35, 0.5, 0.35] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 -right-24 w-[30rem] h-[30rem] rounded-full bg-gradient-to-bl from-indigo-400/15 to-purple-400/10 blur-3xl"
        animate={{ scale: [1, 1.12, 1], opacity: [0.3, 0.45, 0.3] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="min-h-screen pb-32 pt-4 sm:pt-6">
        <motion.div
          className="px-4 space-y-4 max-w-screen-md mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Transaction Number Display */}
          <div className="flex items-center justify-center p-2">
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
                {localStorage.getItem("provisionalTransactionNumber") ||
                  "Scan Store QR to Begin"}
              </span>
            </button>
          </div>
          {/* Scanner Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <ScannerCard
              onScan={handleScan}
              paused={scannerPaused}
              onResume={() => setScannerPaused(false)}
              className="w-full"
              textMain="text-blue-700"
            />
          </motion.div>

          {/* Error Display */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm shadow-lg backdrop-blur-sm"
              >
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>{error}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading Indicator */}
          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-blue-700 text-sm text-center shadow-lg backdrop-blur-sm"
              >
                <div className="flex items-center justify-center gap-2">
                  <motion.div
                    className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                  <span>Loading product...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Order Drawer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="w-full" variant="glass">
              <OrderDrawer
                open={drawerOpen}
                onToggle={() => setDrawerOpen((v) => !v)}
                cart={cart}
                onIncrement={increment}
                onDecrement={decrement}
                onRemove={removeItem}
              />
              {cart.length === 0 && (
                <div className="p-4 text-center text-gray-500">
                  Cart is empty
                </div>
              )}
            </Card>
          </motion.div>
        </motion.div>

        <ActionBar
          total={total}
          onCancel={() => setCart([])}
          onCheckout={() => setShowCheckout(true)}
          disabled={cart.length === 0}
        />

        {cart.length > 0 && (
          <CheckoutModal
            isOpen={showCheckout}
            onClose={() => setShowCheckout(false)}
            total={total}
            method={paymentMethod}
            setMethod={setPaymentMethod}
            cart={cart}
            onPay={async (method) => {
              const businessId = localStorage.getItem("business_id");
              if (!businessId) {
                setError("No store selected. Please scan the store QR first.");
                setShowCheckout(false);
                return;
              }
              if (method === "Cash") {
                const customerUserId = localStorage.getItem("customer_user_id");
                setShowCheckout(false);
                try {
                  const body = {
                    items: cart.map((i) => ({
                      product_id: i.product_id,
                      sku: i.sku,
                      quantity: i.quantity,
                    })),
                    payment_type: method.toLowerCase(),
                    money_received: total,
                    business_id: Number(businessId),
                    customer_user_id: customerUserId
                      ? Number(customerUserId)
                      : null,
                    transaction_number: localStorage.getItem(
                      "provisionalTransactionNumber"
                    ),
                  };
                  const res = await api("/api/sales/public/checkout", {
                    method: "POST",
                    body: JSON.stringify(body),
                  });
                  setCart([]);
                  if (res.qr_payload) {
                    setShowCartQR(true);
                    setCheckoutMessage("");
                    setQrPayload(res.qr_payload);
                    setTransactionId(res.transaction_id);
                  } else {
                    setCheckoutMessage("Failed to generate payment QR");
                  }
                } catch (err) {
                  setCheckoutMessage("Checkout failed");
                }
                return;
              }
              if (method === "GCash") {
                try {
                  const successUrl =
                    window.location.origin + "/customer?payment=success";
                  const cancelUrl =
                    window.location.origin + "/customer?payment=cancel";
                  localStorage.setItem(
                    "pending_gcash_cart_public",
                    JSON.stringify({
                      items: cart.map((i) => ({
                        product_id: i.product_id,
                        sku: i.sku,
                        quantity: i.quantity,
                      })),
                      total,
                      transactionNumber: localStorage.getItem(
                        "provisionalTransactionNumber"
                      ),
                    })
                  );
                  const { checkoutUrl } = await createGcashCheckout({
                    amount: Number(total || 0),
                    description: "Self-checkout Order",
                    referenceNumber: `SC-${Date.now()}`,
                    cancelUrl,
                    successUrl,
                  });
                  window.location.href = checkoutUrl;
                } catch (e) {
                  setError(e.message || "Failed to initialize online payment");
                  localStorage.removeItem("pending_gcash_cart_public");
                } finally {
                  setShowCheckout(false);
                }
                return;
              }
              // default: fallback to immediate record (e.g., PayMaya placeholder)
              try {
                const customerUserId = localStorage.getItem("customer_user_id");
                const body = {
                  items: cart.map((i) => ({
                    product_id: i.product_id,
                    sku: i.sku,
                    quantity: i.quantity,
                  })),
                  payment_type: method,
                  money_received: total,
                  business_id: Number(businessId),
                  customer_user_id: customerUserId
                    ? Number(customerUserId)
                    : null,
                  transaction_number: localStorage.getItem(
                    "provisionalTransactionNumber"
                  ),
                };
                const res = await api("/api/sales/public/checkout", {
                  method: "POST",
                  body: JSON.stringify(body),
                });
                setCart([]);
                // Show cashier QR for cash payments (returned in qr_payload)
                if (res.qr_payload) {
                  setShowCartQR(true);
                  setCheckoutMessage("");
                  // Pass qr_payload to modal
                  setQrPayload(res.qr_payload);
                  setTransactionId(res.transaction_id);
                } else {
                  // Redirect to receipt after non-GCash online record
                  const url = new URL(window.location.origin + "/receipt");
                  url.searchParams.set("tn", res.transaction_number);
                  url.searchParams.set("tid", String(res.transaction_id));
                  url.searchParams.set("total", String(res.total || 0));
                  window.location.href = url.toString();
                }
              } catch (err) {
                setCheckoutMessage("Checkout failed");
              } finally {
                setShowCheckout(false);
              }
            }}
          />
        )}

        <CustomerCartQRModal
          isOpen={showCartQR}
          onClose={() => setShowCartQR(false)}
          onTransactionComplete={handleTransactionComplete}
          qrPayload={qrPayload}
          transactionId={transactionId}
        />

        <AnimatePresence>
          {checkoutMessage && (
            <motion.div
              className="px-4 mt-4 max-w-screen-md mx-auto"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-700 text-sm shadow-lg backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 flex-shrink-0"
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
                  <span>{checkoutMessage}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Background>
  );
}

export default MobileScannerView;
