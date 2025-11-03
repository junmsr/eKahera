import React, { useState } from 'react';
import ScannerCard from '../components/ui/POS/ScannerCard';
import SkuFormCard from '../components/ui/POS/SkuFormCard';
import TransactionCard from '../components/ui/POS/TransactionCard';
import CartTableCard from '../components/ui/POS/CartTableCard';
import Button from '../components/common/Button';
import Background from '../components/layout/Background';
import { api } from '../lib/api';
import PriceCheckModal from '../components/modals/PriceCheckModal';
import DiscountModal from '../components/modals/DiscountModal';
import CashLedgerModal from '../components/modals/CashLedgerModal';
import ProductReplacementModal from '../components/modals/ProductReplacementModal';

function CashierPOS() {
  // State
  const [sku, setSku] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState([]);
  const [showRefund, setShowRefund] = useState(false);
  const [showDiscount, setShowDiscount] = useState(false);
  const [showPriceCheck, setShowPriceCheck] = useState(false);
  const [showCashLedger, setShowCashLedger] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [scannerPaused, setScannerPaused] = useState(false);
  const [error, setError] = useState('');
  const [transactionNumber, setTransactionNumber] = useState('');
  const [transactionId, setTransactionId] = useState(null);

  const token = localStorage.getItem('auth_token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Generate a provisional transaction number when this POS view opens
  React.useEffect(() => {
    if (!transactionNumber) {
      const businessId = user?.businessId || user?.business_id || 'BIZ';
      const timePart = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
      const randPart = Math.floor(1000 + Math.random() * 9000);
      setTransactionNumber(`T-${businessId}-${timePart}-${randPart}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addSkuToCart = async (skuValue, qty = 1) => {
    if (!skuValue || qty < 1) return;
    setError('');
    try {
      const product = await api(`/api/products/sku/${encodeURIComponent(skuValue)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const price = Number(product.selling_price || 0);
      setCart((prev) => {
        const existingIdx = prev.findIndex(i => i.product_id === product.product_id);
        if (existingIdx >= 0) {
          const next = [...prev];
          next[existingIdx] = { ...next[existingIdx], quantity: next[existingIdx].quantity + qty };
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
      setSku('');
      setQuantity(1);
      setScannerPaused(false);
    } catch (err) {
      setError(err.message || 'Product not found');
    }
  };

  const handleAddToCart = async () => addSkuToCart(sku, quantity);

  const handleRemove = (idx) => setCart(cart.filter((_, i) => i !== idx));
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = (() => {
    if (!appliedDiscount) return subtotal;
    if (typeof appliedDiscount.value === 'string' && appliedDiscount.value.endsWith('%')) {
      const pct = parseFloat(appliedDiscount.value);
      if (Number.isFinite(pct) && pct > 0) return Math.max(0, subtotal - subtotal * (pct / 100));
    }
    const fixed = Number(appliedDiscount.value);
    if (Number.isFinite(fixed) && fixed > 0) return Math.max(0, subtotal - fixed);
    return subtotal;
  })();

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setError('');
    try {
      const body = {
        items: cart.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
        payment_type: 'cash',
        money_received: total,
        ...(appliedDiscount && typeof appliedDiscount.value === 'string' && appliedDiscount.value.endsWith('%')
          ? { discount_percentage: parseFloat(appliedDiscount.value) }
          : appliedDiscount
          ? { discount_amount: Number(appliedDiscount.value) }
          : {}),
      };
      const resp = await api('/api/sales/checkout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (resp?.transaction_number) setTransactionNumber(resp.transaction_number);
      if (resp?.transaction_id) setTransactionId(resp.transaction_id);
      setCart([]);
      // Start a fresh provisional transaction number after successful checkout
      const businessId = user?.businessId || user?.business_id || 'BIZ';
      const timePart = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
      const randPart = Math.floor(1000 + Math.random() * 9000);
      setTransactionNumber(`T-${businessId}-${timePart}-${randPart}`);
      setAppliedDiscount(null);
    } catch (err) {
      setError(err.message || 'Checkout failed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  const cardClass = 'bg-white border border-blue-100 rounded-2xl p-6 shadow-lg';

  return (
    <Background variant="gradientBlue" pattern="dots" floatingElements overlay>
      <div className="h-screen overflow-hidden">
        {/* Header with logout */}
        <header className="flex items-center justify-between px-6 py-3 bg-white/80 shadow-sm border-b border-blue-100 h-[56px] min-h-[56px] max-h-[56px]">
          <span className="text-2xl font-bold text-blue-700 tracking-tight flex items-center gap-2">
            <span className="bg-blue-600 text-white rounded-xl px-3 py-1 text-xl font-bold mr-2">eK</span>
            POS - Cashier
          </span>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Welcome, {user.name || user.username || 'Cashier'}</span>
            <Button
              label="Logout"
              variant="secondary"
              size="sm"
              onClick={handleLogout}
              className="px-4 py-2"
            />
          </div>
        </header>
        
        {/* Main Area */}
        <main className="flex-1 bg-transparent overflow-hidden p-4 h-[calc(100vh-56px)]">
          <div
            className="grid gap-8 h-full"
            style={{
              gridTemplateColumns: '1fr 2fr',
              gridTemplateRows: '325px 325px 1fr 120px',
              height: '100%',
            }}
          >
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
            {/* CartTableCard (spans 3 rows on the right) */}
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
                  onClick={handleCheckout}
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
              <TransactionCard transactionNumber={transactionNumber} transactionId={transactionId} />
            </div>
          </div>
        </main>
        
        {/* Modals */}
        <DiscountModal
          isOpen={showDiscount}
          onClose={() => setShowDiscount(false)}
          onApplyDiscount={(discount) => {
            setAppliedDiscount(discount);
            setShowDiscount(false);
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
      </div>
    </Background>
  );
}

export default CashierPOS;
