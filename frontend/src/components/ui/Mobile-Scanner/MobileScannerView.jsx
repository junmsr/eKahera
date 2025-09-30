import React, { useMemo, useState } from 'react';
import Background from '../../layout/Background';
import Navbar from '../../layout/Navbar';
import ScannerCard from '../../ui/POS/ScannerCard';
import Card from '../../common/Card';
import OrderDrawer from './OrderDrawer';
import CheckoutModal from './CheckoutModal';
import ActionBar from './ActionBar';
import { api, authHeaders } from '../../../lib/api';

function MobileScannerView() {
  const [cart, setCart] = useState([]);
  const [scannerPaused, setScannerPaused] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('GCash');
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState('');
  const [error, setError] = useState('');

  const total = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);

  const handleScan = async (result) => {
    const code = result?.[0]?.rawValue;
    if (!code) return;
    
    setScannerPaused(true);
    setError('');
    setLoading(true);
    
    try {
      // Check if product already exists in cart
      const existingIndex = cart.findIndex(p => p.sku === code);
      if (existingIndex !== -1) {
        // Just increment quantity for existing item
        setCart(prev => {
          const updated = [...prev];
          updated[existingIndex] = { ...updated[existingIndex], quantity: updated[existingIndex].quantity + 1 };
          return updated;
        });
        setScannerPaused(false);
        return;
      }

      // Fetch product from database using public endpoint
      // Prefer stored business_id if available; backend now also supports fallback without it
      const storedBusinessId = localStorage.getItem('business_id');
      const query = storedBusinessId ? `?business_id=${encodeURIComponent(storedBusinessId)}` : '';
      const product = await api(`/api/products/public/sku/${encodeURIComponent(code)}${query}`);

      if (product) {
        const price = Number(product.selling_price || 0);
        const productName = product.product_name || `Product ${code}`;
        
        setCart(prev => [
          ...prev,
          {
            product_id: product.product_id,
            sku: product.sku,
            name: productName,
            quantity: 1,
            price: price,
          },
        ]);
      }
    } catch (err) {
      setError(err.message || 'Product not found');
      console.error('Error fetching product:', err);
    } finally {
      setLoading(false);
      setScannerPaused(false);
    }
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

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-blue-700 text-sm text-center">
              Loading product...
            </div>
          )}

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
          onPay={async () => {
            try {
              const businessId = localStorage.getItem('business_id');
              const body = {
                items: cart.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
                payment_type: paymentMethod,
                money_received: total,
                business_id: businessId ? Number(businessId) : null,
              };
              const res = await api('/api/sales/public/checkout', { method: 'POST', body: JSON.stringify(body) });
              setCheckoutMessage(`Transaction ${res.transaction_number} completed. Total ₱${Number(res.total || 0).toFixed(2)}`);
              setCart([]);
            } catch (err) {
              setCheckoutMessage('Checkout failed');
            } finally {
              setShowCheckout(false);
            }
          }}
        />

        {checkoutMessage && (
          <div className="px-4 mt-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-sm">
              {checkoutMessage}
            </div>
          </div>
        )}
      </div>
    </Background>
  );
}

export default MobileScannerView;
