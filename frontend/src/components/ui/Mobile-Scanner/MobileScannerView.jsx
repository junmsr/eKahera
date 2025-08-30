import React, { useMemo, useState } from 'react';
import Background from '../../layout/Background';
import Navbar from '../../layout/Navbar';
import ScannerCard from '../../ui/POS/ScannerCard';
import Card from '../../common/Card';
import OrderDrawer from './OrderDrawer';
import CheckoutModal from './CheckoutModal';
import ActionBar from './ActionBar';

function MobileScannerView() {
  const [cart, setCart] = useState([]);
  const [scannerPaused, setScannerPaused] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('GCash');
  const [drawerOpen, setDrawerOpen] = useState(true);

  const total = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);

  const handleScan = result => {
    const code = result?.[0]?.rawValue;
    if (!code) return;
    setScannerPaused(true);
    setCart(prev => {
      const existingIndex = prev.findIndex(p => p.sku === code);
      if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], quantity: updated[existingIndex].quantity + 1 };
        return updated;
      }
      return [...prev, { sku: code, name: `Product ${code}`, quantity: 1, price: 100 }];
    });
  };

  const increment = sku => setCart(prev => prev.map(p => p.sku === sku ? { ...p, quantity: p.quantity + 1 } : p));
  const decrement = sku => setCart(prev => prev.map(p => p.sku === sku ? { ...p, quantity: Math.max(1, p.quantity - 1) } : p));
  const removeItem = sku => setCart(prev => prev.filter(p => p.sku !== sku));

  return (
    <Background variant="gradientBlue" pattern="dots" floatingElements overlay>
      <div className="min-h-screen pb-32">
        <div className="pt-20 px-4">
          <Navbar />
        </div>

        <div className="px-4 mt-4 space-y-4">
          <ScannerCard
            onScan={handleScan}
            paused={scannerPaused}
            onResume={() => setScannerPaused(false)}
            className="w-full"
            textMain="text-blue-700"
          />


          <Card className="w-full emphasized-card" variant="glass" microinteraction>
            <OrderDrawer
              open={drawerOpen}
              onToggle={() => setDrawerOpen(v => !v)}
              cart={cart}
              onIncrement={increment}
              onDecrement={decrement}
              onRemove={removeItem}
            />
          </Card>
        </div>

        <ActionBar
          total={total}
          onCancel={() => setCart([])}
          onCheckout={() => setShowCheckout(true)}
        />

        <CheckoutModal
          isOpen={showCheckout}
          onClose={() => setShowCheckout(false)}
          total={total}
          method={paymentMethod}
          setMethod={setPaymentMethod}
          onPay={() => setShowCheckout(false)}
        />
      </div>
    </Background>
  );
}

export default MobileScannerView;
