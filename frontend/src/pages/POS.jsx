import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ScannerCard from "../components/ui/POS/ScannerCard";
import SkuFormCard from "../components/ui/POS/SkuFormCard";
import TransactionCard from "../components/ui/POS/TransactionCard";
import CartTableCard from "../components/ui/POS/CartTableCard";
import Button from "../components/common/Button";
import NavAdmin from "../components/layout/Nav-Admin";
import PageLayout from "../components/layout/PageLayout";
import Background from "../components/layout/Background";
import { api } from "../lib/api";
import PriceCheckModal from "../components/modals/PriceCheckModal";
import DiscountModal from "../components/modals/DiscountModal";
import CashLedgerModal from "../components/modals/CashLedgerModal";
import ProductReplacementModal from "../components/modals/ProductReplacementModal";
import CheckoutModal from "../components/modals/CheckoutModal";
import CashPaymentModal from "../components/modals/CashPaymentModal";
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
  const [showCashLedger, setShowCashLedger] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [scannerPaused, setScannerPaused] = useState(false);
  const [error, setError] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const notificationRef = useRef(null);

  const transactionNumber = "000000000";
  const token = localStorage.getItem("auth_token");
  const user = JSON.parse(localStorage.getItem("auth_user") || "{}");

  const handleAddToCart = async () => {
    if (!sku || quantity < 1) return;
    setError("");
    try {
      const product = await api(`/api/products/sku/${encodeURIComponent(sku)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const price = Number(product.selling_price || 0);
      setCart([
        ...cart,
        {
          product_id: product.product_id,
          sku: product.sku,
          name: product.product_name,
          quantity,
          price,
        },
      ]);
      setSku("");
      setQuantity(1);
      setScannerPaused(false);
    } catch (err) {
      setError(err.message || "Product not found");
    }
  };

  const handleRemove = (idx) => setCart(cart.filter((_, i) => i !== idx));

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = async (paymentType = "cash", moneyReceived = total) => {
    if (cart.length === 0) return;
    setError("");
    try {
      const body = {
        items: cart.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
        payment_type: paymentType,
        money_received: moneyReceived,
      };
      await api("/api/sales/checkout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      setCart([]);
    } catch (err) {
      setError(err.message || "Checkout failed");
    }
  };

  const cardClass = "bg-white border border-blue-100 rounded-2xl p-6 shadow-lg";

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleProfileClick = () => {
    navigate("/profile"); // Adjust this route if necessary
  };

  const headerActions = (
    <div className="flex items-center gap-4">
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

        {/* Notification Dropdown */}
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
                      <h4 className="font-medium text-gray-900">{notification.title}</h4>
                      <span className="text-xs text-gray-500">{notification.time}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500">No notifications</div>
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
    <Background variant="gradientBlue" pattern="dots" floatingElements overlay>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <NavAdmin />

        {/* Main Content */}
        <div className="flex-1 ml-28 flex flex-col h-screen">
          {/* Header */}
          <header className="flex items-center gap-4 px-6 py-3 bg-white/80 shadow-sm border-b border-blue-100 h-[56px] min-h-[56px] max-h-[56px]">
            <span className="text-2xl font-bold text-blue-700 tracking-tight flex items-center gap-2">
              <span className="bg-blue-600 text-white rounded-xl px-3 py-1 text-xl font-bold mr-2">eK</span>
              POS
            </span>

            <div className="ml-auto">{headerActions}</div>
          </header>

          {/* Main Area */}
          <main className="flex-1 bg-transparent overflow-hidden p-4">
            <div
              className="grid gap-8 h-full"
              style={{
                gridTemplateColumns: "1fr 2fr",
                gridTemplateRows: "325px 325px 1fr 120px",
                height: "100%",
              }}
            >
              {/* ScannerCard */}
              <div className="row-span-1 col-span-1">
                <ScannerCard
                  onScan={(result) => {
                    if (result?.[0]?.rawValue) {
                      setSku(result[0].rawValue);
                      setScannerPaused(true);
                    }
                  }}
                  paused={scannerPaused}
                  onResume={() => setScannerPaused(false)}
                  textMain="text-blue-700"
                />
              </div>

              {/* CartTableCard */}
              <div className="row-span-3 col-start-2 row-start-1 flex flex-col h-full">
                <CartTableCard cart={cart} handleRemove={handleRemove} total={total} className="flex-1" />

                {/* Action Buttons */}
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
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
              <div className="row-start-2 col-start-1 mb-0">
                <SkuFormCard
                  sku={sku}
                  setSku={setSku}
                  quantity={quantity}
                  setQuantity={setQuantity}
                  handleAddToCart={handleAddToCart}
                />
                {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
              </div>

              {/* TransactionCard */}
              <div className="row-start-3 col-start-1 -mt-16">
                <TransactionCard transactionNumber={transactionNumber} />
              </div>
            </div>
          </main>

          {/* Modals */}
          <DiscountModal
            isOpen={showDiscount}
            onClose={() => setShowDiscount(false)}
            onApplyDiscount={(discount) => {
              // Apply the discount to your transaction/cart here
            }}
          />
          <PriceCheckModal isOpen={showPriceCheck} onClose={() => setShowPriceCheck(false)} />
          <CashLedgerModal isOpen={showCashLedger} onClose={() => setShowCashLedger(false)} />
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
                // For GCASH/MAYA, proceed directly
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
        </div>
      </div>
    </Background>
  );
}

export default POS;
