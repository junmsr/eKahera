import React, { useState } from 'react';
import ScannerCard from '../components/ui/POS/ScannerCard';
import SkuFormCard from '../components/ui/POS/SkuFormCard';
import TransactionCard from '../components/ui/POS/TransactionCard';
import CartTableCard from '../components/ui/POS/CartTableCard';
import Button from '../components/common/Button';
import Modal from '../components/modals/Modal';
import NavAdmin from '../components/layout/Nav-Admin';
import Background from '../components/layout/Background';
import { api } from '../lib/api';
import PriceCheckModal from '../components/modals/PriceCheckModal';
import DiscountModal from '../components/modals/DiscountModal';
import CashLedgerModal from '../components/modals/CashLedgerModal';
import ProductReplacementModal from '../components/modals/ProductReplacementModal';

function POS() {
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
  const transactionNumber = '000000000';

  const token = localStorage.getItem('auth_token');
  const user = JSON.parse(localStorage.getItem('auth_user') || '{}');

  const handleAddToCart = async () => {
    if (!sku || quantity < 1) return;
    setError('');
    try {
      const product = await api(`/api/products/sku/${encodeURIComponent(sku)}`);
      const price = Number(product.selling_price || 0);
      setCart([...cart, { product_id: product.product_id, sku: product.sku, name: product.product_name, quantity, price }]);
      setSku('');
      setQuantity(1);
      setScannerPaused(false);
    } catch (err) {
      setError(err.message || 'Product not found');
    }
  };
  const handleRemove = idx => setCart(cart.filter((_, i) => i !== idx));
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setError('');
    try {
      const body = {
        tenant_id: 1,
        items: cart.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
        payment_type: true,
        money_received: total,
      };
      await api('/api/sales/checkout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body)
      });
      setCart([]);
    } catch (err) {
      setError(err.message || 'Checkout failed');
    }
  };

  const cardClass = "bg-white border border-blue-100 rounded-2xl p-6 shadow-lg";

  return (
    <Background variant="gradientBlue" pattern="dots" floatingElements overlay>
      <div className="flex">
        <NavAdmin />
        <div className="flex-1 ml-28 min-h-screen flex flex-col">
          <header className="flex items-center gap-4 px-8 py-6 bg-white/80 shadow-sm border-b border-blue-100">
            <span className="text-3xl font-bold text-blue-700 tracking-tight flex items-center gap-2">
              <span className="bg-blue-600 text-white rounded-xl px-3 py-1 text-2xl font-bold mr-2">eK</span>
              POS
            </span>
          </header>
          <main className="flex-1 flex flex-col px-8 py-8 bg-transparent">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="flex flex-col gap-6">
                <div className={cardClass}>
                  <div className="font-bold text-blue-700 text-lg mb-2">SCAN QR & BARCODE</div>
                  <ScannerCard
                    onScan={result => {
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
                <div className={cardClass}>
                  <SkuFormCard
                    sku={sku}
                    setSku={setSku}
                    quantity={quantity}
                    setQuantity={setQuantity}
                    handleAddToCart={handleAddToCart}
                  />
                  {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
                </div>
                <div className={cardClass}>
                  <TransactionCard transactionNumber={transactionNumber} />
                </div>
              </div>
              <div className={cardClass + " flex-1 min-w-0"}>
                <CartTableCard cart={cart} handleRemove={handleRemove} total={total} />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 w-full max-w-4xl mx-auto">
              <Button label="CASH LEDGER" size="lg" className="w-full" variant="secondary" microinteraction aria-label="Cash Ledger" />
              <Button label="DISCOUNT" size="lg" className="w-full" onClick={() => setShowDiscount(true)} variant="secondary" microinteraction aria-label="Discount" />
              <Button label="REFUND" size="lg" className="w-full" onClick={() => setShowRefund(true)} variant="secondary" microinteraction aria-label="Product Refund" />
              <Button label="PRICE CHECK" size="lg" className="w-full" onClick={() => setShowPriceCheck(true)} variant="secondary" microinteraction aria-label="Price Check" />
              <Button label="CHECKOUT" size="lg" className="w-full" variant="primary" microinteraction aria-label="Checkout" onClick={handleCheckout} />
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
          </header>
          {/* Main Area */}
          <main className="flex-1 bg-transparent overflow-hidden p-4">
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
                  onScan={result => {
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
              {/* CartTableCard (spans 3 rows on the right) */}
              <div className="row-span-3 col-start-2 row-start-1 flex flex-col h-full">
                <CartTableCard cart={cart} handleRemove={handleRemove} total={total} className="flex-1" />
                {/* Action Buttons */}
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                  <Button label="CASH LEDGER" size="lg" className="w-full h-16 text-base font-bold" variant="secondary" microinteraction onClick={() => setShowCashLedger(true)} />
                  <Button label="DISCOUNT" size="lg" className="w-full h-16 text-base font-bold" onClick={() => setShowDiscount(true)} variant="secondary" microinteraction />
                    {/* Big Checkout Button */}
                  <Button label="CHECKOUT" size="lg" className="w-full h-35 text-lg font-bold row-span-2" variant="primary" microinteraction />
                  <Button label="REFUND" size="lg" className="w-full h-16 text-base font-bold" onClick={() => setShowRefund(true)} variant="secondary" microinteraction />
                  <Button label="PRICE CHECK" size="lg" className="w-full h-16 text-base font-bold" onClick={() => setShowPriceCheck(true)} variant="secondary" microinteraction />
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
              </div>
              {/* TransactionCard */}
              <div className="row-start-3 col-start-1 -mt-16">
                <TransactionCard transactionNumber={transactionNumber} />
              </div>
            </div>
          </main>
          <Modal isOpen={showRefund} onClose={() => setShowRefund(false)} title="Product Refund">
            <div>Refund logic goes here.</div>
          </Modal>
          <DiscountModal
            isOpen={showDiscount}
            onClose={() => setShowDiscount(false)}
            onApplyDiscount={discount => {
              // Apply the discount to your transaction/cart here
              // Example: setAppliedDiscount(discount);
            }}
          />
          <PriceCheckModal isOpen={showPriceCheck} onClose={() => setShowPriceCheck(false)} />
          <CashLedgerModal isOpen={showCashLedger} onClose={() => setShowCashLedger(false)} />
          <ProductReplacementModal
            isOpen={showRefund}
            onClose={() => setShowRefund(false)}
            onConfirm={data => {
              // Handle refund logic here
              setShowRefund(false);
            }}
          />
        </div>  
      </div>
    </Background>
  );
}

export default POS;
