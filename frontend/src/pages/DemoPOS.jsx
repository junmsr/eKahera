import React, { useState, useRef, useEffect } from "react";
import PageLayout from "../components/layout/PageLayout";
import DemoNav from "../components/layout/DemoNav";
import SkuFormCard from "../components/ui/POS/SkuFormCard";
import CartTableCard from "../components/ui/POS/CartTableCard";
import Button from "../components/common/Button";
import CheckoutModal from "../components/modals/CheckoutModal";
import CashPaymentModal from "../components/modals/CashPaymentModal";

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
    <div className="flex items-center gap-4 mr-3">
      <div className="text-lg font-semibold">
        Total: <span>₱{total.toFixed(2)}</span>
      </div>
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
      <div className="flex-1 flex flex-col min-h-screen p-4 bg-gray-50">
        <div className="grid gap-4 h-full grid-cols-1 lg:grid-cols-12">
          {/* Left Column */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-sm text-blue-800">
              <strong>Hint:</strong> Use SKUs 1001, 1002, 1003, 1004 to add
              items.
            </div>
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
              <div className="bg-red-50 border-l-4 border-red-500 p-3 text-red-700 text-sm">
                {error}
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="flex-1 min-h-0">
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
                className="h-full"
              />
            </div>
            <Button
              label="CHECKOUT (DEMO)"
              size="lg"
              variant="primary"
              onClick={() => setShowCheckout(true)}
              disabled={cart.length === 0}
              className="w-full py-4 text-lg font-bold"
            />
          </div>
        </div>
      </div>

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
