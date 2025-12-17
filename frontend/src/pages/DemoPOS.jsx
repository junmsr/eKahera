import React, { useState, useRef, useEffect } from "react";
import PageLayout from "../components/layout/PageLayout";
import DemoNav from "../components/layout/DemoNav";
import ScannerCard from "../components/ui/POS/ScannerCard";
import SkuFormCard from "../components/ui/POS/SkuFormCard";
import CartTableCard from "../components/ui/POS/CartTableCard";
import Button from "../components/common/Button";
import CheckoutModal from "../components/modals/CheckoutModal";
import CashPaymentModal from "../components/modals/CashPaymentModal";
import DiscountModal from "../components/modals/DiscountModal";
import PriceCheckModal from "../components/modals/PriceCheckModal";
import CashLedgerModal from "../components/modals/CashLedgerModal";
import AdminReceiptsModal from "../components/modals/AdminReceiptsModal";
import { BiReceipt } from "react-icons/bi";
import { MdClose } from "react-icons/md";

const ButtonLabel = ({ text, shortcut, variant = "secondary" }) => (
  <div className="flex items-center gap-2">
    <span>{text}</span>
    <span
      className={`hidden sm:inline-block text-xs font-bold px-1.5 py-0.5 rounded border ${
        variant === "primary"
          ? "bg-white/20 border-white/40 text-white"
          : "bg-gray-100 border-gray-300 text-gray-600"
      }`}
    >
      {shortcut}
    </span>
  </div>
);

// Mock Product Database
const MOCK_PRODUCTS = [
  {
    product_id: 1,
    sku: "1001",
    product_name: "Demo Coffee",
    selling_price: 120,
    stock_quantity: 50,
  },
  {
    product_id: 2,
    sku: "1002",
    product_name: "Demo Sandwich",
    selling_price: 85,
    stock_quantity: 20,
  },
  {
    product_id: 3,
    sku: "1003",
    product_name: "Demo Cake Slice",
    selling_price: 150,
    stock_quantity: 15,
  },
  {
    product_id: 4,
    sku: "1004",
    product_name: "Demo Water",
    selling_price: 25,
    stock_quantity: 100,
  },
];

function DemoPOS() {
  const [sku, setSku] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);
  const [error, setError] = useState("");
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [selectedCartIdx, setSelectedCartIdx] = useState(0);
  const [editQty, setEditQty] = useState("1");
  const [editingCartItem, setEditingCartItem] = useState(null);

  const skuInputRef = useRef(null);
  const quantityInputRef = useRef(null);

  useEffect(() => {
    skuInputRef.current?.focus();
  }, []);

  const addSkuToCart = (skuValue, qty = 1) => {
    if (!skuValue) return;
    setError("");

    const product = MOCK_PRODUCTS.find((p) => p.sku === skuValue);

    if (!product) {
      setError("Product not found (Try SKUs: 1001, 1002, 1003, 1004)");
      return;
    }

    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (i) => i.product_id === product.product_id
      );
      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx] = {
          ...next[existingIdx],
          quantity: next[existingIdx].quantity + qty,
        };
        return next;
      }
      return [
        ...prev,
        {
          product_id: product.product_id,
          sku: product.sku,
          name: product.product_name,
          quantity: qty,
          price: product.selling_price,
        },
      ];
    });
    setSku("");
    setQuantity(1);
    skuInputRef.current?.focus();
  };

  const handleAddToCart = () => {
    addSkuToCart(sku, quantity);
  };

  const handleRemove = (idx) => {
    setCart(cart.filter((_, i) => i !== idx));
  };

  const handleEditQuantity = (idx, qty) => {
    const newQty = Math.max(1, Number(qty) || 1);
    setCart((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, quantity: newQty } : item))
    );
    setEditingCartItem(null);
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const total = subtotal;

  const handleCheckout = (method) => {
    alert(
      `Demo Checkout Successful via ${method}! Total: ₱${total.toFixed(2)}`
    );
    setCart([]);
    setShowCheckout(false);
    setShowCashModal(false);
  };

  const headerActions = (
    <div className="flex items-center gap-1 sm:gap-4 mr-3">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-lg font-semibold">
          <span>Total:</span>
          <span>₱{total.toFixed(2)}</span>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <button className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg px-2 py-1.5 sm:px-2.5 shadow-sm">
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
            Demo Store
          </span>
        </button>
      </div>
      <button
        className="flex items-center gap-2 bg-white/80 backdrop-blur-sm p-1.5 sm:px-3 sm:py-2 rounded-lg border border-gray-200/80 hover:bg-gray-50 transition-colors"
        title="View all receipts"
      >
        <div className="relative">
          <BiReceipt className="w-5 h-5 text-blue-600" />
        </div>
        <span className="text-sm font-medium text-gray-700 hidden sm:inline">
          Receipts
        </span>
      </button>
      <div className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold">
        DEMO MODE
      </div>
    </div>
  );

  return (
    <PageLayout
      title="POS (DEMO)"
      sidebar={<DemoNav />}
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
                  onScan={(result) => {
                    const code = result?.[0]?.rawValue;
                    if (!code) return;
                    addSkuToCart(code, 1);
                  }}
                  paused={false}
                  onResume={() => {}}
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
                      {error}
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
              <div className="flex-1 min-h-0 max-h-[calc(100vh-280px)]">
                <CartTableCard
                  cart={cart}
                  handleRemove={handleRemove}
                  handleEditQuantity={handleEditQuantity}
                  total={total}
                  selectedIdx={selectedCartIdx}
                  onSelectRow={(idx) => {
                    setSelectedCartIdx(idx);
                    if (cart[idx]) setEditQty(String(cart[idx].quantity));
                  }}
                  editingIdx={editingCartItem}
                  editQty={editQty}
                  onEditQtyChange={setEditQty}
                  onEditComplete={() => setEditingCartItem(null)}
                  onStartEdit={setEditingCartItem}
                  className="flex-1 h-full"
                />
              </div>
              {/* Action Buttons */}
              <div className="grid grid-cols-12 gap-2 sm:gap-3 flex-shrink-0">
                {/* Grouped Buttons */}
                <div className="col-span-8">
                  <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 sm:gap-3">
                    <Button
                      label={<ButtonLabel text="CASH LEDGER" shortcut="F5" />}
                      size="md"
                      className="w-full h-10 sm:h-12 text-xs sm:text-sm font-bold"
                      variant="secondary"
                      microinteraction
                      onClick={() => {}}
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
                    <div className="relative group flex-1">
                      <Button
                        label={
                          <ButtonLabel text="ADD DISCOUNT" shortcut="F6" />
                        }
                        variant="secondary"
                        onClick={() => {}}
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
                              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        }
                        className="w-full h-10 sm:h-12 text-xs sm:text-sm font-bold"
                      />
                    </div>
                    <Button
                      label={<ButtonLabel text="PRICE CHECK" shortcut="F7" />}
                      size="md"
                      className="w-full h-10 sm:h-12 text-xs sm:text-sm font-bold"
                      onClick={() => {}}
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
                      label={
                        <ButtonLabel text="SCAN CUSTOMER QR" shortcut="F8" />
                      }
                      size="md"
                      className="w-full h-10 sm:h-12 text-xs sm:text-sm font-bold"
                      onClick={() => {}}
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
                    label={
                      <ButtonLabel
                        text="CHECKOUT"
                        shortcut="F12"
                        variant="primary"
                      />
                    }
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
        isOpen={false}
        onClose={() => {}}
        onApplyDiscount={() => {}}
      />
      <PriceCheckModal
        isOpen={false}
        onClose={() => {}}
        sku=""
        setSku={() => {}}
      />
      <CashLedgerModal isOpen={false} onClose={() => {}} />
      <AdminReceiptsModal isOpen={false} onClose={() => {}} />
      <CheckoutModal
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        total={total}
        onSelectPayment={(method) =>
          method === "cash" ? setShowCashModal(true) : handleCheckout(method)
        }
      />
      <CashPaymentModal
        isOpen={showCashModal}
        onClose={() => setShowCashModal(false)}
        total={total}
        onConfirm={() => handleCheckout("cash")}
      />
    </PageLayout>
  );
}

export default DemoPOS;
