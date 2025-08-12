import React, { useState } from 'react';
import ScannerCard from '../components/ui/POS/ScannerCard';
import SkuFormCard from '../components/ui/POS/SkuFormCard';
import TransactionCard from '../components/ui/POS/TransactionCard';
import CartTableCard from '../components/ui/POS/CartTableCard';
import Button from '../components/common/Button';
import Modal from '../components/modals/Modal';
import NavAdmin from '../components/layout/Nav-Admin';
import Background from '../components/layout/Background';

function POS() {
  // State
  const [sku, setSku] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState([]);
  const [showRefund, setShowRefund] = useState(false);
  const [showDiscount, setShowDiscount] = useState(false);
  const [showPriceCheck, setShowPriceCheck] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [scannerPaused, setScannerPaused] = useState(false);
  const transactionNumber = '000000000';

  // Handlers
  const handleAddToCart = () => {
    if (!sku || quantity < 1) return;
    setCart([...cart, { sku, name: `Product ${sku}`, quantity, price: 100 }]);
    setSku('');
    setQuantity(1);
    setScannerPaused(false);
  };
  const handleRemove = idx => setCart(cart.filter((_, i) => i !== idx));
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

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
                  <Button label="CASH LEDGER" size="lg" className="w-full h-16 text-base font-bold" variant="secondary" microinteraction />
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
          {/* Modals */}
          <Modal isOpen={showRefund} onClose={() => setShowRefund(false)} title="Product Refund">
            <div>Refund logic goes here.</div>
          </Modal>
          <Modal isOpen={showDiscount} onClose={() => setShowDiscount(false)} title="Discount">
            <div>Discount logic goes here.</div>
          </Modal>
          <Modal isOpen={showPriceCheck} onClose={() => setShowPriceCheck(false)} title="Price Check">
            <div>Price check logic goes here.</div>
          </Modal>
        </div>
      </div>
    </Background>
  );
}

export default POS;
